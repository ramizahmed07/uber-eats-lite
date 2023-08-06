import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { Verification } from './entities/verification.entity';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput) {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (user) return { ok: false, error: 'User already exists' };

      const newUser = await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
      const verification = await this.verificationsRepository.save(
        this.verificationsRepository.create({
          user: newUser,
        }),
      );
      await this.mailService.sendVerificationEmail(email, verification.code);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        select: ['password', 'id'],
      });
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
    user: User,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      if (email) {
        const exists = await this.usersRepository.findOne({ where: { email } });
        if (exists) return { ok: false, error: 'Email is already taken' };
        user.email = email;
        user.verified = false;
        const { code } = await this.verificationsRepository.save(
          this.verificationsRepository.create({ user }),
        );
        await this.mailService.sendVerificationEmail(email, code);
      }
      if (password) {
        user.password = password;
      }
      await this.usersRepository.save(user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async verifyEmail({ code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verificationsRepository.findOne({
        where: { code },
        relations: ['user'],
      });

      if (!verification) return { ok: false, error: 'Incorrect code' };

      await this.usersRepository.update(verification.user.id, {
        verified: true,
      });
      await this.verificationsRepository.delete(verification.id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
