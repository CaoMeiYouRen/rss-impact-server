import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Feed } from '@/db/models/feed.entity'

@Injectable()
export class FeedService {

    private readonly logger = new Logger(FeedService.name)

    constructor(
        @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
    ) { }
}
