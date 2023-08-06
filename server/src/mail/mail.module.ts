import { Global, Module } from '@nestjs/common';
import { MailService as SendgridService } from '@sendgrid/mail';

import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

export const sendgridProviders = [
  {
    provide: CONFIG_OPTIONS,
    useFactory: (): SendgridService => {
      const mail = new SendgridService();
      mail.setApiKey(process.env.SENDGRID_API_KEY);
      mail.setTimeout(5000);
      return mail;
    },
  },
];

@Global()
@Module({
  providers: [...sendgridProviders, MailService],
  exports: [MailService],
})
export class MailModule {}
