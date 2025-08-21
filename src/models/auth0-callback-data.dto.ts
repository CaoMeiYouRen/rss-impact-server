import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class Auth0CallbackData {

    @IsOptional()
    @IsString()
    id_token?: string

    @IsOptional()
    @IsString()
    state?: string

    @IsOptional()
    @IsString()
    code?: string

    @IsOptional()
    @IsString()
    sid?: string

}
