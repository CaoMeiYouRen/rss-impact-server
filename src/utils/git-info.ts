import { execSync } from 'child_process'

interface GitInfo {
    gitHash?: string
    gitDate?: string
}

function getGitInfo(): GitInfo {
    let gitHash = process.env.GIT_HASH
    let gitDate = process.env.GIT_DATE

    if (!gitHash) {
        try {
            gitHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 8)
            const gitDateStr = execSync('git log -1 --format=%cd').toString().trim()
            gitDate = new Date(gitDateStr).toISOString()
        } catch (error) {
            console.error('Failed to get Git commit hash and date:', error)
            gitHash = 'unknown'
            gitDate = 'unknown'
        }
    }

    return { gitHash, gitDate }
}

export { getGitInfo }
