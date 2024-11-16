import { Injectable } from '@nestjs/common'
import fs from 'fs-extra'
import { getGitInfo } from './utils/git-info'

@Injectable()
export class AppService {
    async getHello() {
        const { version } = await fs.readJson('package.json')
        const { gitHash, gitDate } = await getGitInfo()
        return {
            statusCode: 200,
            message: 'Hello RSS Impact!',
            timestamp: new Date(),
            version,
            gitHash,
            gitDate: new Date(gitDate),
            commitUrl: `https://github.com/CaoMeiYouRen/rss-impact-server/commit/${gitHash}`,
            issueUrl: 'https://github.com/CaoMeiYouRen/rss-impact-server/issues',
            docsUrl: 'https://rss-docs.cmyr.dev',
        }
    }
}
