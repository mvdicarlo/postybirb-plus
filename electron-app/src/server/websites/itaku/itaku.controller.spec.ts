import { Test, TestingModule } from '@nestjs/testing';
import { ItakuController } from './itaku.controller';

describe('ItakuController', () => {
  let controller: ItakuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItakuController],
    }).compile();

    controller = module.get<ItakuController>(ItakuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
