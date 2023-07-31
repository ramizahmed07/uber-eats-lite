import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput) {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (user) return { ok: false, error: 'User already exists' };

      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create account" };
    }
  }
}
