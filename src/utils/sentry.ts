import * as Sentry from '@sentry/nestjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { __PROD__, SENTRY_DSN } from '@/app.config'

if (__PROD__ && SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // 性能追踪
        tracesSampleRate: 0.1,
        // 性能分析
        profilesSampleRate: 0.1,
    })
}

