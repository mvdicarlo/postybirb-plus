import { Test, TestingModule } from '@nestjs/testing';
import { FileRepositoryService } from './file-repository.service';

describe('FileRepositoryService', () => {
  let service: FileRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileRepositoryService],
    }).compile();

    service = module.get<FileRepositoryService>(FileRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
