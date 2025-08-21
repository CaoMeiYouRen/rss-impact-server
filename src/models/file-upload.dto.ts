import { ApiProperty } from '@nestjs/swagger'
import { Express } from 'express'

export class FileUploadDto {

    @ApiProperty({ title: '要上传的文件', type: 'string', format: 'binary' })
    file: Express.Multer.File

}
