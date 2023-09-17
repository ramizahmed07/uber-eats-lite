import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { Role } from 'src/common/common.types';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const token = '$2342.2sd324d.32dd2dsgtj2.s3';

const mockRepository = () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockedJwtService = () => ({
  sign: jest.fn(() => token),
  verify: jest.fn(),
});

const mockedMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        { provide: JwtService, useValue: mockedJwtService() },
        { provide: MailService, useValue: mockedMailService() },
      ],
    }).compile();
    service = module.get(UsersService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'lalaland@gmail.com',
      password: 'lalaland',
      role: Role.Client,
    };
    const verificationArgs = {
      user: createAccountArgs,
      code: '577739',
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'hello@gmail.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({ ok: false, error: 'User already exists' });
    });
    it('should create a new user incase of no user found', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue(verificationArgs);
      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        verificationArgs.user.email,
        verificationArgs.code,
      );
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@test.com',
      password: 'test',
    };
    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: expect.any(Object),
        select: expect.any(Array),
      });
      expect(result).toEqual({ ok: false, error: 'User not found' });
    });
    it('should fail if password is incorrect', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(mockedUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(mockedUser.checkPassword).toHaveBeenCalledWith(loginArgs.password);
      expect(result).toEqual({
        ok: false,
        error: 'Incorrect email or password',
      });
    });
    it('should return token if password is correct', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      });

      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ ok: true, token });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: expect.any(Object) });
    });
  });

  describe('findById', () => {
    const mockedUser = { id: 1, email: 'test@test.com' };
    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      const result = await service.findById(mockedUser.id);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockedUser.id },
      });
      expect(result).toEqual({ ok: true, user: mockedUser });
    });

    it('should return error if user does not exist', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const user = await service.findById(mockedUser.id);
      expect(user).toEqual({ ok: false, error: 'User not found' });
    });
  });

  describe('editUserProfile', () => {
    it('should not change email if email is taken', async () => {
      const editProfileArgs = { email: 'test@test.com' };

      usersRepository.findOne.mockResolvedValue(editProfileArgs);
      const result = await service.editUserProfile(
        { email: 'example@example.com' } as User,
        editProfileArgs,
      );
      expect(result).toEqual({ ok: false, error: 'Email is already taken' });
    });
    it('should change email', async () => {
      const editProfileArgs = { email: 'test@test.com' };
      const verification = {
        code: '553357',
      };
      const oldUser = {
        email: 'example@example.com',
        verified: true,
      } as User;

      const newUser = {
        email: editProfileArgs.email,
        verified: false,
      } as User;
      usersRepository.findOne.mockResolvedValue(null);
      verificationsRepository.create.mockReturnValue(oldUser);
      verificationsRepository.save.mockResolvedValue(verification);
      await service.editUserProfile(oldUser, editProfileArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: editProfileArgs.email },
      });
      expect(oldUser).toEqual(newUser);
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(newUser);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        editProfileArgs.email,
        verification.code,
      );
    });
    it('should change password', async () => {
      const editProfileArgs = {
        password: 'newPassword',
      };

      const oldUser = { password: 'oldPassword' } as User;
      const newUser = { password: editProfileArgs.password } as User;

      const result = await service.editUserProfile(oldUser, editProfileArgs);
      expect(editProfileArgs.password).toBeDefined();
      expect(oldUser).toEqual(newUser);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editUserProfile(
        { email: 'test@test.com' } as User,
        { email: 'new@example.com' },
      );
      expect(result).toEqual({ ok: false, error: 'Could not update profile' });
    });
  });
  describe('verifyEmail', () => {
    const code = '$2abj28s5jds-23jds2-223fw-234s';
    const verification = { id: 2, user: { id: 1 } };

    it('should verify email', async () => {
      verificationsRepository.findOne.mockResolvedValue(verification);
      const result = await service.verifyEmail({ code });
      expect(verificationsRepository.findOne).toHaveBeenCalledWith({
        where: { code },
        relations: ['user'],
      });
      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(usersRepository.update).toHaveBeenCalledWith(
        verification.user.id,
        { verified: true },
      );
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        verification.id,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(null);
      const result = await service.verifyEmail({ code });
      expect(result).toEqual({ ok: false, error: 'Incorrect code' });
    });

    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockResolvedValue(new Error());
      const result = await service.verifyEmail({ code });
      expect(result).toEqual({ ok: false, error: 'Could not verify email.' });
    });
  });
  describe('getUserProfile', () => {
    const user = {
      id: 1,
    };

    it('should get user profile', async () => {
      service.findById = jest.fn(() =>
        Promise.resolve({
          ok: true,
          user: { id: user.id },
        } as UserProfileOutput),
      );
      const result = await service.getUserProfile({ userId: 1 });
      expect(service.findById).toHaveBeenCalledTimes(1);
      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ ok: true, user });
    });

    it('should fail on profile not found', async () => {
      service.findById = jest.fn(() => Promise.resolve({ ok: false }));
      const result = await service.getUserProfile({ userId: 1 });
      expect(result).toEqual({ ok: false, error: 'User not found' });
    });
    it('should fail on exception', async () => {
      service.findById = jest.fn(() => Promise.reject());
      const result = await service.getUserProfile({ userId: 1 });
      expect(result).toEqual({ ok: false, error: "Couldn't get profile." });
    });
  });
});
