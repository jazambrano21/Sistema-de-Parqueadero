import { Injectable } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(EventoAuditoria)
    private readonly auditRepo: Repository<EventoAuditoria>,
  ) {}

  async create(dto: CreateAuditDto) {
    const newEvent = this.auditRepo.create({
      ...dto,
      datos: dto.datos ?? {},
      timestamp: new Date(),
    });

    return this.auditRepo.save(newEvent);
  }

  async findAll() {
    return this.auditRepo.find({ order: { timestamp: 'DESC' } });
  }

  async findOne(id: string) {
    return this.auditRepo.findOne({ where: { id } });
  }

  async update(id: number, updateAuditDto: UpdateAuditDto) {
    return `This action updates a #${id} audit`;
  }

  async remove(id: number) {
    return `This action removes a #${id} audit`;
  }
}
