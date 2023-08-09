import { Test } from '@nestjs/testing';
import { MailService as SendgridService } from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import { config } from 'process';

const mockedSendgridService = {
  send: jest.fn(),
};

const mockedConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'SENDGRID_SENDER_EMAIL') return 'sender_test_email@gmail.com';
    if (key === 'TEMPLATE_ID') return 'test-template-id';
  }),
};

describe('MailService', () => {
  let service: MailService;
  let sendgridService: SendgridService;
  let configService: ConfigService;
  const toEmail = 'test@test.com';
  const code = 'test-code';
  const sendArgs = {
    toEmail,
    dynamicTemplateData: {
      subject: 'Thank you for signing up!',
      title: 'Please confirm your email',
      content: `Your registration code is ${code}. Do not share this code with anyone.`,
    },
  };
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: mockedSendgridService,
        },
        {
          provide: ConfigService,
          useValue: mockedConfigService,
        },
      ],
    }).compile();
    service = module.get(MailService);
    sendgridService = module.get(CONFIG_OPTIONS);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have sendgrid service defined', () => {
    expect(sendgridService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendVerification', async () => {
      jest
        .spyOn(service, 'send')
        .mockImplementation(async () => ({ ok: true }));
      const result = await service.sendVerificationEmail(toEmail, code);
      expect(service.send).toHaveBeenCalledTimes(1);
      expect(service.send).toHaveBeenCalledWith(sendArgs);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('send', () => {
    it('should send email', async () => {
      const result = await service.send(sendArgs);
      expect(configService.get).toHaveBeenNthCalledWith(
        1,
        'SENDGRID_SENDER_EMAIL',
      );
      expect(configService.get).toHaveBeenNthCalledWith(2, 'TEMPLATE_ID');
      expect(sendgridService.send).toHaveBeenCalledTimes(1);
      expect(sendgridService.send).toHaveBeenCalledWith(
        {
          from: {
            name: 'Uber Eats',
            email: 'sender_test_email@gmail.com',
          },
          replyTo: 'sender_test_email@gmail.com',

          to: toEmail,
          templateId: 'test-template-id',
          dynamicTemplateData: sendArgs.dynamicTemplateData,
        },
        false,
      );

      expect(result).toEqual({ ok: true });
    });
  });
});
