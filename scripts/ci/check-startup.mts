import { NestFactory } from '@nestjs/core'
import { CommonModule } from '../../src/common/common.module'

/**
 * 启动自检：验证框架与 express/serve-static 等运行期依赖组合可以完成初始化。
 * 用 Jest 的 TestingModule 无法覆盖该场景（httpAdapter 尚未挂载时会退化为 NoopLoader），
 * 因此这里直接使用 NestFactory 启动 CommonModule，不监听端口、不连接业务数据库。
 */
async function main() {
    const app = await NestFactory.create(CommonModule, { logger: false })
    await app.init()
    await app.close()
    console.log('启动自检通过')
}

main().catch((error) => {
    console.error('启动自检失败:', error)
    process.exit(1)
})
