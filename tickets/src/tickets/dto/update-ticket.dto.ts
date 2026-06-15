import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
    @IsOptional()
    activo?: boolean;

    @IsNumber()
    @IsOptional()
    valorRecaudado?: number;
}
