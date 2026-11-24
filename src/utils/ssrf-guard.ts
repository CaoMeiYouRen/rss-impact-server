import { BlockList, isIP } from 'net'
import dns from 'dns'
import http from 'http'
import https from 'https'
import { Logger } from '@nestjs/common'
import { SSRF_ALLOW_PRIVATE_NETWORK, SSRF_ALLOWED_CIDRS, SSRF_BLOCKED_CIDRS, SSRF_GUARD_ENABLED } from '@/app.config'

/**
 * SSRF 防护：出站 URL 的协议/凭据校验，以及连接时的 DNS 解析校验。
 *
 * 说明：
 * 1. 输入校验只能挡住 IP 字面量，域名、DNS rebinding、302 跳转必须在连接时拦截；
 * 2. 连接时通过自定义 `lookup` 校验解析结果，保证真正连接的地址与校验的地址一致；
 * 3. 无法识别的地址一律拒绝（fail-closed）。
 *
 * @author CaoMeiYouRen
 * @date 2026-11-24
 */

const logger = new Logger('SsrfGuard')

export interface SsrfGuardOptions {
    /** 是否放行私网/回环/CGNAT/ULA 地址，默认读取 SSRF_ALLOW_PRIVATE_NETWORK */
    allowPrivateNetwork?: boolean
    /** 额外放行的 CIDR，优先级最高，默认读取 SSRF_ALLOWED_CIDRS */
    allowedCidrs?: string[]
    /** 额外封禁的 CIDR，默认读取 SSRF_BLOCKED_CIDRS */
    blockedCidrs?: string[]
}

export interface AssertSafeUrlOptions extends SsrfGuardOptions {
    /** 是否在请求前做一次 DNS 预检。直连场景应依赖连接时的 lookup 校验，避免两次解析之间的 TOCTOU */
    resolve?: boolean
}

export type SafeLookupFunction = (
    hostname: string,
    options: dns.LookupOptions,
    callback: (error: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number) => void,
) => void

export class SsrfBlockedError extends Error {

    readonly hostname?: string

    constructor(message: string, hostname?: string) {
        super(message)
        this.name = 'SsrfBlockedError'
        this.hostname = hostname
    }

}

type AddressType = 'ipv4' | 'ipv6'

interface ParsedCidr {
    address: string
    prefix?: number
    type: AddressType
}

interface SsrfGuardContext {
    allowPrivateNetwork: boolean
    allowed: BlockList
    blocked: BlockList
    metadata: BlockList
    alwaysBlocked: BlockList
    private: BlockList
}

// 私网/回环/CGNAT/ULA：SSRF_ALLOW_PRIVATE_NETWORK=true 时放行
const PRIVATE_RANGES = [
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '::1/128',
    'fc00::/7',
]

// 链路本地、保留、组播、NAT64/6to4/Teredo 等：任何情况下都拒绝（显式 allowlist 除外）
const ALWAYS_BLOCKED_RANGES = [
    '0.0.0.0/8',
    '169.254.0.0/16',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '::/128',
    '::/96',
    '64:ff9b::/96',
    '64:ff9b:1::/48',
    '2001::/32',
    '2001:db8::/32',
    '2002::/16',
    'fe80::/10',
    'ff00::/8',
]

// 云厂商元数据地址：即使放行私网也必须拒绝（显式 allowlist 除外）
const METADATA_ADDRESSES = [
    '169.254.169.254',
    '100.100.100.200',
    'fd00:ec2::254',
    'fe80::a9fe:a9fe',
]

const privateBlockList = createRangeBlockList(PRIVATE_RANGES)
const alwaysBlockedBlockList = createRangeBlockList(ALWAYS_BLOCKED_RANGES)
const metadataBlockList = createRangeBlockList(METADATA_ADDRESSES)

const contextCache = new Map<string, SsrfGuardContext>()

function createRangeBlockList(ranges: string[]): BlockList {
    const blockList = new BlockList()
    ranges.forEach((range) => {
        const cidr = parseCidr(range)
        if (!cidr) {
            logger.warn(`忽略无效的 CIDR 配置：${range}`)
            return
        }
        if (typeof cidr.prefix === 'number') {
            blockList.addSubnet(cidr.address, cidr.prefix, cidr.type)
        } else {
            blockList.addAddress(cidr.address, cidr.type)
        }
    })
    return blockList
}

function parseCidr(cidr: string): ParsedCidr | null {
    const [address, prefix] = cidr?.trim()?.split('/') ?? []
    const family = isIP(address)
    if (!family) {
        return null
    }
    const type: AddressType = family === 6 ? 'ipv6' : 'ipv4'
    if (typeof prefix === 'undefined' || prefix === '') {
        return { address, type }
    }
    const prefixNumber = Number(prefix)
    const maxPrefix = family === 6 ? 128 : 32
    if (!Number.isInteger(prefixNumber) || prefixNumber < 0 || prefixNumber > maxPrefix) {
        return null
    }
    return { address, prefix: prefixNumber, type }
}

function createCidrBlockList(cidrs: string[]): BlockList {
    const blockList = new BlockList()
    cidrs.forEach((cidr) => {
        const parsed = parseCidr(cidr)
        if (!parsed) {
            logger.warn(`忽略无效的 CIDR 配置：${cidr}`)
            return
        }
        if (typeof parsed.prefix === 'number') {
            blockList.addSubnet(parsed.address, parsed.prefix, parsed.type)
        } else {
            blockList.addAddress(parsed.address, parsed.type)
        }
    })
    return blockList
}

function getContext(options: SsrfGuardOptions = {}): SsrfGuardContext {
    const allowPrivateNetwork = options.allowPrivateNetwork ?? SSRF_ALLOW_PRIVATE_NETWORK
    const allowedCidrs = options.allowedCidrs ?? SSRF_ALLOWED_CIDRS
    const blockedCidrs = options.blockedCidrs ?? SSRF_BLOCKED_CIDRS
    const key = [allowPrivateNetwork, allowedCidrs?.join(','), blockedCidrs?.join(',')].join('|')
    let context = contextCache.get(key)
    if (!context) {
        context = {
            allowPrivateNetwork,
            allowed: createCidrBlockList(allowedCidrs ?? []),
            blocked: createCidrBlockList(blockedCidrs ?? []),
            metadata: metadataBlockList,
            alwaysBlocked: alwaysBlockedBlockList,
            private: privateBlockList,
        }
        contextCache.set(key, context)
    }
    return context
}

/**
 * 统一主机名格式：转小写、去掉 IPv6 方括号和末尾的点
 */
export function normalizeHostname(hostname: string): string {
    let host = String(hostname ?? '').trim().toLowerCase()
    if (host.startsWith('[') && host.endsWith(']')) {
        host = host.slice(1, -1)
    }
    host = host.replace(/\.+$/, '')
    return host
}

/**
 * 将 IPv6 地址归一化为压缩形式，便于比较
 */
function canonicalizeAddress(host: string): string {
    if (isIP(host) !== 6) {
        return host
    }
    try {
        return normalizeHostname(new URL(`http://[${host}]`).hostname)
    } catch {
        return host
    }
}

export function isSsrfGuardEnabled(): boolean {
    return SSRF_GUARD_ENABLED
}

/**
 * 判断一个 IP 地址是否应当被拒绝
 */
export function isBlockedAddress(address: string, options: SsrfGuardOptions = {}): boolean {
    const host = canonicalizeAddress(normalizeHostname(address))
    const family = isIP(host)
    if (!family) { // 无法识别的地址一律拒绝
        return true
    }
    const type: AddressType = family === 6 ? 'ipv6' : 'ipv4'
    const context = getContext(options)
    if (context.allowed.check(host, type)) {
        return false
    }
    // ::/96 用于拦截 IPv4-compatible 地址（如 ::127.0.0.1），因此 ::1 需要单独放行
    if (host === '::1') {
        return !context.allowPrivateNetwork
    }
    if (context.metadata.check(host, type)) {
        return true
    }
    if (context.blocked.check(host, type)) {
        return true
    }
    if (context.alwaysBlocked.check(host, type)) {
        return true
    }
    if (context.private.check(host, type)) {
        return !context.allowPrivateNetwork
    }
    return false
}

/**
 * 解析 URL 并做与网络无关的校验
 */
function parseHttpUrl(rawUrl: string): URL {
    let url: URL
    try {
        url = new URL(rawUrl)
    } catch {
        throw new SsrfBlockedError(`无效的 URL：${rawUrl}`)
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new SsrfBlockedError(`不支持的协议：${url.protocol}`)
    }
    if (url.username || url.password) {
        throw new SsrfBlockedError('URL 中不允许包含用户名或密码')
    }
    if (!url.hostname) {
        throw new SsrfBlockedError(`URL 缺少主机名：${rawUrl}`)
    }
    return url
}

async function resolveAndAssertSafe(hostname: string, options: SsrfGuardOptions): Promise<void> {
    let addresses: dns.LookupAddress[]
    try {
        addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true })
    } catch {
        throw new SsrfBlockedError(`域名解析失败：${hostname}`, hostname)
    }
    if (!addresses?.length) {
        throw new SsrfBlockedError(`域名未解析到任何地址：${hostname}`, hostname)
    }
    const blocked = addresses.find((item) => isBlockedAddress(item.address, options))
    if (blocked) {
        throw new SsrfBlockedError(`禁止访问内网地址：${hostname} -> ${blocked.address}`, hostname)
    }
}

/**
 * 请求前校验 URL。
 *
 * 直连场景不建议开启 `resolve`，连接时的 lookup 校验才是最终边界；
 * 通过代理访问时目标由代理解析，无法钉住 IP，需要在请求前做 DNS 预检。
 */
export async function assertSafeUrl(rawUrl: string, options: AssertSafeUrlOptions = {}): Promise<URL> {
    const url = parseHttpUrl(rawUrl)
    if (!isSsrfGuardEnabled()) {
        return url
    }
    const host = normalizeHostname(url.hostname)
    if (isIP(host)) {
        if (isBlockedAddress(host, options)) {
            throw new SsrfBlockedError(`禁止访问内网地址：${host}`, host)
        }
        return url
    }
    if (options.resolve) {
        await resolveAndAssertSafe(host, options)
    }
    return url
}

/**
 * 同步校验 URL，用于 DTO 校验。不做 DNS 解析，域名由连接时校验。
 */
export function isSafeHttpUrl(rawUrl: string, options: SsrfGuardOptions = {}): boolean {
    try {
        const url = parseHttpUrl(rawUrl)
        if (!isSsrfGuardEnabled()) {
            return true
        }
        const host = normalizeHostname(url.hostname)
        if (isIP(host)) {
            return !isBlockedAddress(host, options)
        }
        const context = getContext(options)
        // 单标签主机名（如 localhost）几乎只可能是内网地址
        if (!host.includes('.') && !context.allowPrivateNetwork) {
            return false
        }
        return true
    } catch {
        return false
    }
}

/**
 * 递归校验对象中所有 http/https URL 字符串。
 * 用于把配置对象交给第三方库发请求、无法在连接阶段接管 DNS 的场景。
 */
export async function assertSafeUrlsInValue(
    value: unknown,
    options: AssertSafeUrlOptions & { skipKeys?: string[], maxDepth?: number } = {},
    depth = 0,
): Promise<void> {
    if (depth > (options.maxDepth ?? 5)) {
        return
    }
    if (typeof value === 'string') {
        if (/^https?:\/\//i.test(value)) {
            await assertSafeUrl(value, options)
        }
        return
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            await assertSafeUrlsInValue(item, options, depth + 1)
        }
        return
    }
    if (value && typeof value === 'object') {
        const skipKeys = (options.skipKeys ?? []).map((key) => key.toLowerCase())
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            if (skipKeys.some((skipKey) => key.toLowerCase().includes(skipKey))) {
                continue
            }
            await assertSafeUrlsInValue(item, options, depth + 1)
        }
    }
}

/**
 * 创建带地址校验的 DNS lookup，供 http/https Agent 使用。
 * 每次建立连接都会执行，覆盖 DNS rebinding 与重定向后的新连接。
 */
export function createSafeLookup(options: SsrfGuardOptions = {}): SafeLookupFunction {
    return (hostname, lookupOptions, callback) => {
        const all = Boolean((lookupOptions as dns.LookupAllOptions)?.all)
        dns.lookup(hostname, { ...lookupOptions, all: true, verbatim: true }, (error, addresses) => {
            if (error) {
                callback(error)
                return
            }
            const list = addresses as dns.LookupAddress[]
            if (!list?.length) {
                callback(new SsrfBlockedError(`域名未解析到任何地址：${hostname}`, hostname))
                return
            }
            const blocked = list.find((item) => isBlockedAddress(item.address, options))
            if (blocked) {
                callback(new SsrfBlockedError(`禁止访问内网地址：${hostname} -> ${blocked.address}`, hostname))
                return
            }
            if (all) {
                callback(null, list)
                return
            }
            const [first] = list
            callback(null, first.address, first.family)
        })
    }
}

/**
 * 创建带地址校验的 http/https Agent。SSRF 防护关闭时返回空对象。
 * 使用默认配置时复用同一组 Agent，避免每个请求都新建连接池。
 */
export function createSafeAgents(options?: SsrfGuardOptions) {
    if (!isSsrfGuardEnabled()) {
        return {}
    }
    if (!options) {
        if (!cachedDefaultAgents) {
            cachedDefaultAgents = buildSafeAgents({})
        }
        return cachedDefaultAgents
    }
    return buildSafeAgents(options)
}

interface SafeAgents {
    httpAgent: http.Agent
    httpsAgent: https.Agent
}

let cachedDefaultAgents: SafeAgents | undefined

function buildSafeAgents(options: SsrfGuardOptions): SafeAgents {
    const lookup = createSafeLookup(options)
    return {
        httpAgent: new http.Agent({ lookup } as http.AgentOptions),
        httpsAgent: new https.Agent({ lookup } as https.AgentOptions),
    }
}
