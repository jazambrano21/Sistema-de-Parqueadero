import { Test, TestingModule } from '@nestjs/testing';
import { VehiculoController } from './vehiculo.controller';
import { VehiculosService } from './services/vehiculos.service';

const mockService = {
  create: jest.fn().mockResolvedValue({}),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue({}),
  findByPlaca: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('VehiculoController', () => {
  let controller: VehiculoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiculoController],
      providers: [{ provide: VehiculosService, useValue: mockService }],
    }).compile();

    controller = module.get<VehiculoController>(VehiculoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll returns array', async () => {
    const result = await controller.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
