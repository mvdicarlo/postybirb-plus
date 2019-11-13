import { Test, TestingModule } from '@nestjs/testing';
import { WeasylService } from './weasyl.service';

describe('WeasylService', () => {
  let service: WeasylService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeasylService],
    }).compile();

    service = module.get<WeasylService>(WeasylService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
