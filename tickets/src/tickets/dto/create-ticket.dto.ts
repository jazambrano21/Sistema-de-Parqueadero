import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    placa!: string;

    @IsString()
    @IsNotEmpty()
    dni!: string;

    @IsUUID()
    @IsNotEmpty()
    idEspacio!: string;

    @IsString()
    @IsNotEmpty()
    nombreZona!: string;
}

