import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const TEST_SECRET_KEY = 'test-key';
const TOKEN = 'TOKEN';
const payload = { id: 1 };
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => TOKEN),
  verify: jest.fn(() => payload),
}));

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { secretKey: TEST_SECRET_KEY },
        },
      ],
    }).compile();
    service = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('sign', () => {
    it('should return a signed token', () => {
      const token = service.sign(payload);
      expect(jwt.sign).toHaveBeenCalledWith(payload, TEST_SECRET_KEY);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(token).toEqual(TOKEN);
    });
  });
  describe('verify', () => {
    it('should verify token', () => {
      const result = service.verify(TOKEN);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_SECRET_KEY);
      expect(result).toEqual(payload);
    });
  });
});
