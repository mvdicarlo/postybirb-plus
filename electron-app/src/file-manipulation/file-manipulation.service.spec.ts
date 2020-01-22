import { Test, TestingModule } from '@nestjs/testing';
import { FileManipulationService } from './file-manipulation.service';

describe('FileManipulationService', () => {
  let service: FileManipulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileManipulationService],
    }).compile();

    service = module.get<FileManipulationService>(FileManipulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
