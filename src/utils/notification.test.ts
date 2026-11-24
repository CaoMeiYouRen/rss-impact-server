import { runPushAllInOne } from './notification'

jest.mock('push-all-in-one', () => ({
    runPushAllInOne: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pushAllInOne = require('push-all-in-one').runPushAllInOne as jest.Mock

describe('runPushAllInOne SSRF guard', () => {
    beforeEach(() => {
        pushAllInOne.mockReset()
    })

    it('should block internal urls in notification config', async () => {
        await expect(runPushAllInOne('title', 'desp', {
            type: 'Webhook',
            config: { WEBHOOK_URL: 'http://127.0.0.1:3000/' },
            option: {},
            isRemotePush: false,
            isMarkdown: false,
        } as any)).rejects.toMatchObject({ name: 'SsrfBlockedError' })
        expect(pushAllInOne).not.toHaveBeenCalled()
    })

    it('should skip proxy config and call the push library', async () => {
        pushAllInOne.mockResolvedValue({ status: 200, data: 'ok' })
        await runPushAllInOne('title', 'desp', {
            type: 'Telegram',
            config: { PROXY_URL: 'http://127.0.0.1:7890/' },
            option: {},
            isRemotePush: false,
            isMarkdown: false,
        } as any)
        expect(pushAllInOne).toHaveBeenCalled()
    })
})
