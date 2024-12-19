import os from 'os'
import path from 'path'
import autocannon, { Client, Options } from 'autocannon'
import dotenv from 'dotenv'
import { Octokit } from 'octokit'
import * as betterBytes from 'better-bytes'

dotenv.config({
    path: [
        '.env.local',
        '.env',
    ],
})

const cpuCount = os.cpus().length

const PORT = Number(process.env.PORT || 3000)

const BASE_URL = `http://localhost:${PORT}`

const DATA_PATH = path.resolve(process.env.DATA_PATH || './data')
const DATABASE_PATH = path.join(DATA_PATH, 'database.test.sqlite')

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

const CI = process.env.CI
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || ''
const GITHUB_PR_NUMBER = process.env.GITHUB_PR_NUMBER || ''

async function runAutocannon(param: Options) {
    const result = await autocannon({
        connections: cpuCount * 2, // 并发连接数
        // workers: cpuCount,
        duration: 10, // 测试持续时间（秒）
        timeout: 3, // 超时时间 (秒)
        // overallRate: 100, // 设置限流器的速率，单位为每秒请求数
        // bailout: 1000,
        ...param,
    })
    const resultOutput = `url: ${param.url}\n${autocannon.printResult(result)}`
    console.log(resultOutput)

    if (GITHUB_PR_NUMBER) { // 如果有 GITHUB_PR_NUMBER，则创建评论
        const octokit = new Octokit({
            auth: GITHUB_TOKEN,
        })
        const osInfo = `System: ${os.type()} ${os.release()} (${os.arch()})<br>Node.js: ${process.versions.node}<br>CPU: ${os.cpus().length} cores<br>Memory: ${betterBytes.format(os.totalmem())} MB`
        await octokit.rest.issues.createComment({
            owner: GITHUB_REPOSITORY.split('/')[0],
            repo: GITHUB_REPOSITORY.split('/')[1],
            issue_number: parseInt(GITHUB_PR_NUMBER),
            body: `## System Info \n\n${osInfo}\n\n## Benchmarks Results\n\n\`\`\`\n${resultOutput}\n\`\`\``,
        })
    }
    return result
}

async function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

async function start() {
    const params: Options[] = ([
        {
            url: '/api',
            method: 'GET',
        },
        {
            url: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            setupClient: (client) => {
                client.setBody(JSON.stringify({
                    username: 'admin',
                    password: ADMIN_PASSWORD,
                }))
            },
            connections: cpuCount, // 并发连接数
            timeout: 5, // 超时时间 (秒)
            duration: 10, // 测试持续时间（秒）
            overallRate: 100, // 设置限流器的速率，单位为每秒请求数
        },
        // {
        //     url: '/api/user',
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     setupClient: (client) => {
        //         client.setBody(JSON.stringify({
        //             name: 'Test User',
        //             email: 'test@example.com',
        //         }))
        //     },
        // },
        // {
        //     url: '/api/user/me',
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     setupClient: (client) => {
        //         client.setBody(JSON.stringify({
        //             name: 'Updated Test User',
        //         }))
        //     },
        // },
    ] as Options[]).map((param) => ({
        ...param,
        url: new URL(BASE_URL + param.url).toString(),
    } as Options))

    if (CI) {
        await sleep(5 * 1000)
    }
    await Promise.all(params.map((param) => runAutocannon(param)))

}

start()
