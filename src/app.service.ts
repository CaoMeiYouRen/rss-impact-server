import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import fs from 'fs-extra'
import { getGitInfo } from './utils/git-info'

@Injectable()
export class AppService implements OnApplicationBootstrap {

    private readonly logger = new Logger(AppService.name)

    private version: string
    private gitHash: string
    private gitDate: Date

    constructor() { }

    async onApplicationBootstrap() {
        const { version } = await fs.readJson('package.json')
        const { gitHash, gitDate } = await getGitInfo()
        this.version = version
        this.gitHash = gitHash
        this.gitDate = new Date(gitDate)
    }

    async getHello() {
        const { version, gitHash, gitDate } = this
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
