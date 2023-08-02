import * as jwt from 'jsonwebtoken';
import { Inject, Injectable } from '@nestjs/common';

import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtOptions, JwtPayload } from './jwt.interfaces';

@Injectable()
export class JwtService {
  constructor(@Inject(CONFIG_OPTIONS) private options: JwtOptions) {}

  sign({ id }: JwtPayload): string {
    return jwt.sign({ id }, this.options.secretKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.secretKey);
  }
}
