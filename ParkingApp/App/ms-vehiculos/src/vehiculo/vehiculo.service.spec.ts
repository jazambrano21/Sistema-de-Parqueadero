import { Test, TestingModule } from '@nestjs/testing';
import { VehiculosService } from './services/vehiculos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { EventPublisherService } from '../common/event-publisher.service';
import { ConfigService } from '@nestjs/config';

const mockRepo = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue({ id: 'uuid', placa: 'TEST-001' }),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockPublisher = { publish: jest.fn().mockResolvedValue(undefined) };
const mockConfig = { get: jest.fn().mockReturnValue('http://localhost') };

describe('VehiculosService', () => {
  let service: VehiculosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculosService,
        { provide: getRepositoryToken(Vehiculo), useValue: mockRepo },
        { provide: EventPublisherService, useValue: mockPublisher },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<VehiculosService>(VehiculosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns array', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
