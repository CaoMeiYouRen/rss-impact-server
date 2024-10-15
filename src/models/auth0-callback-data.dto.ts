import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class Auth0CallbackData {

    @IsNotEmpty()
    @IsString()
    id_token: string

    @IsOptional()
    @IsString()
    state?: string

    @IsOptional()
    @IsString()
    sid?: string
}
