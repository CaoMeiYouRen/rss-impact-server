import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import dayjs from 'dayjs'
import { DailyCount, FindDailyCount } from '@/db/models/daily-count.entity'
import { AclCrud, initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { TasksService } from '@/services/tasks/tasks.service'
import { ReCountDto } from '@/models/re-count.dto'
import { ResponseDto } from '@/models/response.dto'
import { AvueCrudOption } from '@/models/avue.dto'

@UseAdmin()
@AclCrud({
    model: DailyCount,
    config: {
        option: {
            title: '使用统计',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindDailyCount,
        },
        create: false,
        update: false,
        delete: false,
    },
})
@ApiTags('daily-count')
@Controller('daily-count')
export class DailyCountController {
    constructor(
        @InjectRepository(DailyCount) private readonly repository: Repository<DailyCount>,
        private readonly tasksService: TasksService,
    ) {
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
    @ApiOperation({ summary: '获取 重新统计接口 option' })
    @Get('reCount/option')
    async reCountOption() {
        const column = initAvueCrudColumn(ReCountDto)
        return {
            title: '重新统计',
            submitBtn: true,
            emptyBtn: true,
            column,
        }
    }

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({
        summary: '重新统计接口',
        description: '需要在后台手动执行，将一定时间内的日志重新统计',
    })
    @Post('reCount')
    async reCount(@Body() body: ReCountDto) {
        const { dayNum = 30 } = body
        const today = dayjs().tz().hour(0).minute(0).second(0).millisecond(0)
        for (let i = 1; i < dayNum; i++) { // 从今天开始往前推 dayNum 天
            // - dayNum + i
            const date = today.add(-dayNum + i, 'day')
            await this.tasksService.dailyCountByDate(date)
        }
        return {
            code: 201,
            message: '重新统计成功！',
        }
    }

}
