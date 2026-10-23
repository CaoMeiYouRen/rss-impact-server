#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const targetDir = process.argv[2] || '/tmp/sqlite-write-test'
const failures = []

function log(message) {
    process.stdout.write(`${message}\n`)
}

function fail(message) {
    failures.push(message)
    log(`[FAIL] ${message}`)
}

function removeDatabaseFiles(file) {
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
        try {
            fs.rmSync(`${file}${suffix}`, { force: true })
        } catch {
            // 清理失败不影响判定
        }
    }
}

function printEnvironment() {
    const report = process.report?.getReport?.()
    const musl = report?.header?.glibcVersionRuntime === undefined
    const alpine = (() => {
        try {
            return fs.readFileSync('/etc/alpine-release', 'utf8').trim()
        } catch {
            return 'unknown'
        }
    })()
    let muslVersion = 'unknown'
    try {
        muslVersion = execSync('apk list -I musl 2>/dev/null', { encoding: 'utf8' }).trim().split(' ')[0] || 'unknown'
    } catch {
        // 非 Alpine 镜像没有 apk
    }
    log(`[env] node=${process.version} alpine=${alpine} musl=${musl ? muslVersion : 'glibc'} dir=${targetDir}`)
}

/**
 * musl 1.2.6 的 pwrite() 会先调用 pwritev2(RWF_NOAPPEND)，只在 EOPNOTSUPP/ENOSYS 时回退。
 * 这里用带偏移的写入直接验证该路径是否可用。
 */
function checkPwrite() {
    const file = path.join(targetDir, 'pwrite-probe.bin')
    removeDatabaseFiles(file)
    const fd = fs.openSync(file, 'w')
    try {
        fs.writeSync(fd, Buffer.from('pwrite'), 0, 6, 0)
        log('[ok] pwrite（带偏移写入）')
    } catch (error) {
        fail(`带偏移写入失败: ${error.code || ''} ${error.message}`)
    } finally {
        fs.closeSync(fd)
        removeDatabaseFiles(file)
    }
}

function loadBetterSqlite3() {
    const bases = [
        process.env.BETTER_SQLITE3_PATH,
        path.join(process.cwd(), 'package.json'),
        '/app/package.json',
    ].filter(Boolean)
    for (const base of bases) {
        try {
            return createRequire(base)('better-sqlite3')
        } catch {
            // 尝试下一个解析位置
        }
    }
    return null
}

function checkSqlite(Database) {
    for (const mode of ['delete', 'wal']) {
        const file = path.join(targetDir, `sqlite-write-${mode}.sqlite`)
        removeDatabaseFiles(file)
        let db
        try {
            db = new Database(file)
            db.pragma('busy_timeout = 5000')
            const actualMode = String(db.pragma(`journal_mode = ${mode}`, { simple: true })).toLowerCase()
            if (actualMode !== mode) {
                throw new Error(`journal_mode 期望 ${mode}，实际 ${actualMode}`)
            }
            db.exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, value TEXT)')
            const insert = db.prepare('INSERT INTO t (value) VALUES (?)')
            db.transaction(() => {
                for (let i = 0; i < 200; i++) {
                    insert.run(`row-${i}`)
                }
            })()
            db.prepare('UPDATE t SET value = ? WHERE id = 1').run('updated')
            db.prepare('DELETE FROM t WHERE id > 100').run()
            db.pragma('wal_checkpoint(TRUNCATE)')
            db.close()
            db = new Database(file)
            const { c: count } = db.prepare('SELECT count(*) AS c FROM t').get()
            if (count !== 100) {
                throw new Error(`重新打开后行数错误: ${count}`)
            }
            log(`[ok] better-sqlite3 ${mode}: 写入/事务/重新打开校验`)
        } catch (error) {
            fail(`better-sqlite3 ${mode} 写入失败: ${error.code || ''} ${error.message}`)
        } finally {
            try {
                db?.close()
            } catch {
                // 已关闭或写入失败，忽略
            }
            removeDatabaseFiles(file)
        }
    }
}

printEnvironment()
fs.mkdirSync(targetDir, { recursive: true })
checkPwrite()

const Database = loadBetterSqlite3()
if (!Database) {
    fail('未找到 better-sqlite3，请确认镜像内已安装或通过 BETTER_SQLITE3_PATH 指定')
} else {
    checkSqlite(Database)
}

if (failures.length) {
    log('')
    log('运行时自检失败。若出现 disk I/O error，请按以下顺序排查：')
    log('- 基础镜像 musl 版本：Alpine 3.24 / musl 1.2.6 会把 pwrite 改为 pwritev2(RWF_NOAPPEND)，仅在 EOPNOTSUPP/ENOSYS 时回退')
    log('- 宿主 seccomp：以 EPERM 拦截 pwritev2 时 musl 不会回退，SQLite 报 SQLITE_IOERR_WRITE（disk I/O error）')
    log('- 处理：升级宿主 Docker/containerd，或使用 Alpine 3.23 基础镜像')
    log('- 详见 docs/sqlite-disk-io-troubleshooting.md')
    process.exit(1)
}
log('SQLite 写入自检全部通过')
