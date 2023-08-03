import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) return { ok: false, error: 'User not found' };
      const isPasswordCorrect = await user.checkPassword(password);

      if (!isPasswordCorrect)
        return { ok: false, error: 'Incorrect email or password' };
      const token = this.jwtService.sign({ id: user.id });
      return { ok: true, token };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getUserProfile({
    userId: id,
  }: UserProfileInput): Promise<UserProfileOutput> {
    try {
      const user = await this.findById(id);
      if (!user) return { ok: false, error: 'User not found' };
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  findById(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async editUserProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (email) user.email = email;
      if (password) user.password = password;
      await this.usersRepository.save(user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
