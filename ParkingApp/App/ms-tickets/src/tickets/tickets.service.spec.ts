import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './common/http-client.service';

const mockRepo = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockReturnValue({}),
  save: jest.fn().mockResolvedValue({ id: 'uuid', activo: true }),
};

const mockHttpClient = { get: jest.fn(), post: jest.fn(), patch: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue('http://localhost') };

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockRepo },
        { provide: HttpClientService, useValue: mockHttpClient },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns array', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
