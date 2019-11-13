import { Test, TestingModule } from '@nestjs/testing';
import { WeasylController } from './weasyl.controller';

describe('Weasyl Controller', () => {
  let controller: WeasylController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeasylController],
    }).compile();

    controller = module.get<WeasylController>(WeasylController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
