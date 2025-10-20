import { Test, TestingModule } from '@nestjs/testing';
import { TwofactorService } from './twofactor.service';

describe('TwofactorService', () => {
  let service: TwofactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwofactorService],
    }).compile();

    service = module.get<TwofactorService>(TwofactorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
