import { execSync } from 'child_process'
import fs from 'fs-extra'
import dayjs from 'dayjs'
import { timeFormat } from './helper'
import { __PROD__ } from '@/app.config'

interface GitInfo {
    gitHash?: string
    gitDate?: string
}

async function getGitInfo(): Promise<GitInfo> {
    let gitHash = ''
    let gitDate = ''

    if (__PROD__ && await fs.pathExists('.gitinfo')) {
        try {
            const gitInfo = await fs.readJSON('.gitinfo')
            gitHash = gitInfo?.gitHash
            gitDate = gitInfo?.gitDate
        } catch (error) {
            console.error('Failed to read.gitinfo:', error)
        }
    }

    if (!gitHash) {
        try {
            gitHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 8)
        } catch (error) {
            console.error('Failed to get Git commit hash and date:', error)
        }
    }
    if (!gitDate) {
        try {
            gitDate = execSync('git log -1 --format=%cd').toString().trim()
        } catch (error) {
            console.error('Failed to get Git commit date:', error)
        }
    }
    if (gitHash) {
        gitHash = gitHash.slice(0, 7)
    } else {
        gitHash = 'unknown'
    }
    if (dayjs(gitDate).isValid()) {
        gitDate = timeFormat(gitDate)
    } else {
        gitDate = 'unknown'
    }
    return { gitHash, gitDate }
}

export { getGitInfo }
