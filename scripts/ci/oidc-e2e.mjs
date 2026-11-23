import http from 'node:http'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../..', import.meta.url))
const APP_PORT = Number(process.env.E2E_APP_PORT || 3201)
const IDP_PORT = Number(process.env.E2E_IDP_PORT || 4201)
const DATA_PATH = await fs.mkdtemp(path.join(os.tmpdir(), 'rss-impact-oidc-e2e-'))
const issuer = `http://127.0.0.1:${IDP_PORT}`
const clientId = 'e2e-client'
const adminEmail = 'admin@example.com'
const mode = process.env.OIDC_E2E_MODE || 'id_token'

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' })
const jwk = publicKey.export({ format: 'jwk' })
jwk.kid = 'e2e-key'
jwk.alg = 'RS256'
jwk.use = 'sig'

const discovery = {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    jwks_uri: `${issuer}/jwks`,
    response_types_supported: ['id_token', 'code'],
    response_modes_supported: ['form_post', 'query'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'email', 'email_verified', 'name', 'nickname', 'picture'],
}

const codes = new Map()

const idp = http.createServer((req, res) => {
    const url = new URL(req.url, issuer)
    if (url.pathname === '/.well-known/openid-configuration') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(discovery))
        return
    }
    if (url.pathname === '/jwks' || url.pathname === '/.well-known/jwks.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ keys: [jwk] }))
        return
    }
    if (url.pathname === '/authorize') {
        const code = crypto.randomUUID()
        codes.set(code, {
            nonce: url.searchParams.get('nonce'),
            state: url.searchParams.get('state'),
            codeChallenge: url.searchParams.get('code_challenge'),
            emailVerified: url.searchParams.get('e2e_email_verified') === 'true',
        })
        const redirect = new URL(url.searchParams.get('redirect_uri'))
        redirect.searchParams.set('code', code)
        redirect.searchParams.set('state', url.searchParams.get('state'))
        res.writeHead(302, { location: redirect.toString() })
        res.end()
        return
    }
    if (url.pathname === '/token') {
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
            const params = new URLSearchParams(body)
            const code = params.get('code')
            const entry = codes.get(code)
            if (!entry) {
                res.writeHead(400, { 'content-type': 'application/json' })
                res.end(JSON.stringify({ error: 'invalid_grant' }))
                return
            }
            const verifier = params.get('code_verifier')
            if (entry.codeChallenge && verifier) {
                const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
                if (challenge !== entry.codeChallenge) {
                    res.writeHead(400, { 'content-type': 'application/json' })
                    res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE mismatch' }))
                    return
                }
            }
            codes.delete(code)
            const idToken = signIdToken({ nonce: entry.nonce, emailVerified: entry.emailVerified })
            res.writeHead(200, { 'content-type': 'application/json' })
            res.end(JSON.stringify({
                access_token: 'e2e-access-token',
                token_type: 'Bearer',
                expires_in: 300,
                id_token: idToken,
            }))
        })
        return
    }
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
})

function base64url(input) {
    return Buffer.from(input).toString('base64url')
}

function signIdToken({ nonce, emailVerified = false, audience = clientId, subject = 'auth0|attacker', email = adminEmail }) {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT', kid: 'e2e-key' }
    const payload = {
        iss: issuer,
        aud: audience,
        sub: subject,
        email,
        email_verified: emailVerified,
        nonce,
        iat: now,
        exp: now + 300,
    }
    const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKeyPem).toString('base64url')
    return `${signingInput}.${signature}`
}

class CookieJar {

    constructor() {
        this.cookies = new Map()
    }

    store(setCookieHeaders) {
        for (const header of setCookieHeaders) {
            const [pair, ...attrs] = header.split(';')
            const index = pair.indexOf('=')
            if (index < 0) { continue }
            const name = pair.slice(0, index).trim()
            const value = pair.slice(index + 1).trim()
            const secure = attrs.some((attr) => attr.trim().toLowerCase() === 'secure')
            if (secure) {
                // 模拟浏览器：HTTP 页面不保存 Secure cookie
                this.cookies.delete(name)
                continue
            }
            this.cookies.set(name, value)
        }
    }

    header() {
        return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    }

}

function getSetCookies(response) {
    if (typeof response.headers.getSetCookie === 'function') {
        return response.headers.getSetCookie()
    }
    const raw = response.headers.get('set-cookie')
    return raw ? [raw] : []
}

async function waitForApp() {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`http://localhost:${APP_PORT}/api/auth/meta`)
            if (response.status === 200) { return }
        } catch {
            // retry
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
    throw new Error('app did not start')
}

async function loginFlow(jar) {
    const response = await fetch(`http://localhost:${APP_PORT}/api/auth/login`, {
        redirect: 'manual',
        headers: { cookie: jar.header() },
    })
    jar.store(getSetCookies(response))
    if (response.status !== 302) {
        throw new Error(`login expected 302, got ${response.status}: ${await response.text()}`)
    }
    const location = response.headers.get('location')
    if (!location) { throw new Error('login missing location') }
    const url = new URL(location)
    return {
        location,
        nonce: url.searchParams.get('nonce'),
        state: url.searchParams.get('state'),
        redirectUri: url.searchParams.get('redirect_uri'),
        responseType: url.searchParams.get('response_type'),
        responseMode: url.searchParams.get('response_mode'),
        clientId: url.searchParams.get('client_id'),
        codeChallenge: url.searchParams.get('code_challenge'),
        codeChallengeMethod: url.searchParams.get('code_challenge_method'),
    }
}

async function callback(jar, idToken, state) {
    const body = new URLSearchParams({ id_token: idToken, state })
    const response = await fetch(`http://localhost:${APP_PORT}/api/auth/callback`, {
        method: 'POST',
        redirect: 'manual',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            cookie: jar.header(),
        },
        body,
    })
    jar.store(getSetCookies(response))
    return response
}

function assert(condition, message) {
    if (!condition) { throw new Error(message) }
}

async function main() {
    console.log(`OIDC E2E 数据目录: ${DATA_PATH}`)

    await new Promise((resolve) => idp.listen(IDP_PORT, '127.0.0.1', resolve))

    const app = spawn(process.execPath, ['dist/main.js'], {
        cwd: REPO,
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: String(APP_PORT),
            BASE_URL: `http://localhost:${APP_PORT}`,
            AUTH0_BASE_URL: `http://localhost:${APP_PORT}`,
            AUTH0_CLIENT_ID: clientId,
            AUTH0_SECRET: '0123456789012345678901234567890123456789abcdef',
            AUTH0_ISSUER_BASE_URL: issuer,
            OIDC_AUTO_DETECT: 'false',
            OIDC_RESPONSE_TYPE: mode === 'code' ? 'code' : 'id_token',
            OIDC_RESPONSE_MODE: mode === 'code' ? 'query' : 'form_post',
            OIDC_SCOPE: 'openid profile email',
            OIDC_REDIRECT_URL: `http://localhost:${APP_PORT}/api/auth/callback`,
            DATA_PATH,
            RESOURCE_DOWNLOAD_PATH: path.join(DATA_PATH, 'download'),
            ADMIN_EMAIL: adminEmail,
            ADMIN_PASSWORD: 'AdminPass123!',
            SESSION_SECRET: 'session-secret-for-e2e-0123456789',
            LOG_LEVEL: 'error',
            ENABLE_REGISTER: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    let appLogs = ''
    app.stdout.on('data', (chunk) => { appLogs += chunk.toString() })
    app.stderr.on('data', (chunk) => { appLogs += chunk.toString() })

    try {
        await waitForApp()

        if (mode === 'code') {
            async function codeFlow(emailVerified) {
                const jar = new CookieJar()
                const flow = await loginFlow(jar)
                assert(flow.responseType === 'code', `unexpected response_type: ${flow.responseType}`)
                assert(flow.responseMode === 'query', `unexpected response_mode: ${flow.responseMode}`)
                assert(flow.redirectUri === `http://localhost:${APP_PORT}/api/auth/callback`, `unexpected redirect_uri: ${flow.redirectUri}`)
                assert(flow.nonce && flow.state, 'code flow missing nonce/state')
                assert(flow.codeChallenge, 'code flow missing PKCE code_challenge')
                assert(flow.codeChallengeMethod === 'S256', `unexpected code_challenge_method: ${flow.codeChallengeMethod}`)

                const authorizeUrl = new URL(flow.location)
                authorizeUrl.searchParams.set('e2e_email_verified', String(emailVerified))
                const idpResponse = await fetch(authorizeUrl, { redirect: 'manual' })
                assert(idpResponse.status === 302, `authorize expected 302, got ${idpResponse.status}`)
                const callbackUrl = new URL(idpResponse.headers.get('location'))
                const response = await fetch(`http://localhost:${APP_PORT}${callbackUrl.pathname}${callbackUrl.search}`, {
                    redirect: 'manual',
                    headers: { cookie: jar.header() },
                })
                jar.store(getSetCookies(response))
                return { jar, response }
            }

            const unverified = await codeFlow(false)
            const unverifiedBody = await unverified.response.text()
            assert(unverified.response.status >= 400, `unverified code login should be rejected, got ${unverified.response.status}: ${unverifiedBody}`)
            const unverifiedMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: unverified.jar.header() } })
            assert(unverifiedMe.status === 401, `unverified code login must not authenticate, got ${unverifiedMe.status}`)
            console.log('PASS: code flow unverified email rejected', unverified.response.status)

            const verified = await codeFlow(true)
            const verifiedBody = await verified.response.text()
            assert(verified.response.status === 302, `verified code login should redirect, got ${verified.response.status}: ${verifiedBody}`)
            assert((verified.response.headers.get('location') || '').includes('/?state=oidc_login_'), `unexpected redirect: ${verified.response.headers.get('location')}`)
            const verifiedMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: verified.jar.header() } })
            const verifiedMeBody = await verifiedMe.json().catch(() => null)
            assert(verifiedMe.status === 200, `code flow /api/user/me expected 200, got ${verifiedMe.status}`)
            assert(verifiedMeBody?.username === 'admin', `expected admin, got ${JSON.stringify(verifiedMeBody)}`)
            console.log('PASS: code flow verified email logged in')
            console.log('\nOIDC code-flow E2E PASS')
            return
        }

        // 1. 未验证邮箱：必须拒绝
        const jar1 = new CookieJar()
        const flow1 = await loginFlow(jar1)
        assert(flow1.redirectUri === `http://localhost:${APP_PORT}/api/auth/callback`, `unexpected redirect_uri: ${flow1.redirectUri}`)
        assert(flow1.responseType === 'id_token', `unexpected response_type: ${flow1.responseType}`)
        assert(flow1.responseMode === 'form_post', `unexpected response_mode: ${flow1.responseMode}`)
        assert(flow1.clientId === clientId, `unexpected client_id: ${flow1.clientId}`)
        assert(flow1.nonce && flow1.state, 'login flow missing nonce/state')

        const unverified = await callback(jar1, signIdToken({ nonce: flow1.nonce, emailVerified: false }), flow1.state)
        const unverifiedBody = await unverified.text()
        assert(unverified.status >= 400, `unverified email should be rejected, got ${unverified.status}: ${unverifiedBody}`)
        const unverifiedMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: jar1.header() } })
        assert(unverifiedMe.status === 401, `unverified email must not authenticate, got ${unverifiedMe.status}`)
        console.log('PASS: unverified email rejected', unverified.status)

        // 2. 错误 audience：必须拒绝
        const jar2 = new CookieJar()
        const flow2 = await loginFlow(jar2)
        const wrongAud = await callback(jar2, signIdToken({ nonce: flow2.nonce, emailVerified: true, audience: 'other-client' }), flow2.state)
        const wrongAudBody = await wrongAud.text()
        assert(wrongAud.status >= 400, `wrong audience should be rejected, got ${wrongAud.status}: ${wrongAudBody}`)
        const wrongAudMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: jar2.header() } })
        assert(wrongAudMe.status === 401, `wrong audience must not authenticate, got ${wrongAudMe.status}`)
        console.log('PASS: wrong audience rejected', wrongAud.status)

        // 2b. 错误 nonce：必须拒绝
        const jarNonce = new CookieJar()
        const flowNonce = await loginFlow(jarNonce)
        const wrongNonce = await callback(jarNonce, signIdToken({ nonce: 'wrong-nonce', emailVerified: true }), flowNonce.state)
        const wrongNonceBody = await wrongNonce.text()
        assert(wrongNonce.status >= 400, `wrong nonce should be rejected, got ${wrongNonce.status}: ${wrongNonceBody}`)
        const wrongNonceMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: jarNonce.header() } })
        assert(wrongNonceMe.status === 401, `wrong nonce must not authenticate, got ${wrongNonceMe.status}`)
        console.log('PASS: wrong nonce rejected', wrongNonce.status)

        // 2c. 错误 state：必须拒绝
        const jarState = new CookieJar()
        const flowState = await loginFlow(jarState)
        const wrongState = await callback(jarState, signIdToken({ nonce: flowState.nonce, emailVerified: true }), 'wrong-state')
        const wrongStateBody = await wrongState.text()
        assert(wrongState.status >= 400, `wrong state should be rejected, got ${wrongState.status}: ${wrongStateBody}`)
        const wrongStateMe = await fetch(`http://localhost:${APP_PORT}/api/user/me`, { headers: { cookie: jarState.header() } })
        assert(wrongStateMe.status === 401, `wrong state must not authenticate, got ${wrongStateMe.status}`)
        console.log('PASS: wrong state rejected', wrongState.status)

        // 3. 已验证邮箱：允许绑定 admin 并建立会话
        const jar3 = new CookieJar()
        const flow3 = await loginFlow(jar3)
        const ok = await callback(jar3, signIdToken({ nonce: flow3.nonce, emailVerified: true }), flow3.state)
        const okBody = await ok.text()
        assert(ok.status === 302, `verified email should redirect, got ${ok.status}: ${okBody}`)
        assert((ok.headers.get('location') || '').includes('/?state=oidc_login_'), `unexpected redirect: ${ok.headers.get('location')}`)
        assert(jar3.cookies.has('connect.sid'), 'verified email should create app session')
        console.log('PASS: verified email logged in')

        // 4. 会话应能访问 /api/user/me，且身份为 admin
        const me = await fetch(`http://localhost:${APP_PORT}/api/user/me`, {
            headers: { cookie: jar3.header() },
        })
        const meBody = await me.json().catch(() => null)
        assert(me.status === 200, `GET /api/user/me expected 200, got ${me.status}: ${JSON.stringify(meBody)}`)
        assert(meBody?.username === 'admin', `expected admin, got ${JSON.stringify(meBody)}`)
        console.log('PASS: session maps to admin')

        console.log('\nOIDC E2E PASS')
    } catch (error) {
        console.error('\nOIDC E2E FAIL:', error.message)
        console.error('\n--- app logs ---\n', appLogs.slice(-8000))
        process.exitCode = 1
    } finally {
        app.kill('SIGTERM')
        await new Promise((resolve) => idp.close(resolve))
    }
}

main().catch((error) => {
    console.error('OIDC E2E FAIL:', error)
    process.exit(1)
})
