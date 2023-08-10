import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MailService as SendgridService,
  MailDataRequired,
} from '@sendgrid/mail';

import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { SendEmailInput } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS)
    private readonly sendgridService: SendgridService,
    private readonly config: ConfigService,
  ) {}

  async send({ toEmail, dynamicTemplateData }: SendEmailInput) {
    try {
      const sendersEmail = this.config.get('SENDGRID_SENDER_EMAIL');
      const msg: MailDataRequired = {
        from: {
          name: 'Uber Eats',
          email: sendersEmail,
        },
        replyTo: sendersEmail,

        to: toEmail,
        templateId: this.config.get('TEMPLATE_ID'),
        dynamicTemplateData,
      };

      await this.sendgridService.send(msg, false);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  sendVerificationEmail(toEmail: string, code: string) {
    return this.send({
      toEmail,
      dynamicTemplateData: {
        subject: 'Thank you for signing up!',
        title: 'Please confirm your email',
        content: `Your registration code is ${code}. Do not share this code with anyone.`,
      },
    });
  }
}
