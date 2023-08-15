import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'ramizahmediar@gmail.com',
  password: 'test',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let token: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', token).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await usersRepository.delete({});
    await app.close();
  });

  describe('createAccount', () => {
    it('should create a account', () => {
      return publicTest(`mutation{
        createAccount(input:{email:"${testUser.email}", password:"${testUser.password}", role: Owner}){
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount).toEqual({
            error: null,
            ok: true,
          });
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(`mutation{
        createAccount(input:{email:"${testUser.email}", password:"${testUser.password}", role: Owner}){
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount).toEqual({
            ok: false,
            error: 'User already exists',
          });
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`mutation{
        login(input:{email:"${testUser.email}", password:"${testUser.password}"}) {
          error
          ok
          token
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login).toEqual({
            ok: true,
            error: null,
            token: expect.any(String),
          });
          token = res.body.data.login.token;
        });
    });
    it('should not be able to login with incorrect credentials', () => {
      return publicTest(`mutation{
        login(input:{email:"${testUser.email}", password:"incorrect_password"}) {
          error
          ok
          token
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login).toEqual({
            ok: false,
            error: 'Incorrect email or password',
            token: null,
          });
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should get a user's profile", () => {
      return privateTest(`{
        userProfile(userId:${userId}) {
          error
          ok
          user{
            email 
          }
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile).toEqual({
            ok: true,
            error: null,
            user: { email: testUser.email },
          });
        });
    });

    it("should not get a user's profile", () => {
      return privateTest(`{
        userProfile(userId:3243) {
          error
          ok
          user{
            email 
          }
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userProfile).toEqual({
            ok: false,
            error: 'User not found',
            user: null,
          });
        });
    });
  });

  describe('me', () => {
    it("should get logged in user's profile", () => {
      return privateTest(`{
        me {
          email
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.me).toEqual({ email: testUser.email });
        });
    });

    it("should not get logged out user's profile", () => {
      return publicTest(`{
        me {
          email
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ errors: expect.any(Array), data: null });
        });
    });
  });

  describe('editProfile', () => {
    const email = 'leoniddimitri47@gmail.com';
    it('should edit email', async () => {
      return privateTest(`mutation {
        editProfile(input: {email:"${email}"}) {
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.editProfile).toEqual({ ok: true, error: null });
        })
        .then(() =>
          privateTest(`{
          me {
            email
          }
        }`)
            .expect(200)
            .expect((res) => {
              expect(res.body.data.me).toEqual({ email });
            }),
        );
    });
    it('should not edit email if email is already taken', () => {
      return privateTest(`mutation {
        editProfile(input: {email:"${email}"}) {
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.editProfile).toEqual({
            ok: false,
            error: 'Email is already taken',
          });
        });
    });
  });

  describe('verifyEmail', () => {
    let code;
    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      code = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`mutation {
          verifyEmail(input:{code:"${code}"}){
            error
            ok
          }
        }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail).toEqual({ error: null, ok: true });
        });
    });

    it('should fail on incorrect verification code', () => {
      return publicTest(`mutation {
        verifyEmail(input:{code:"${code}"}){
          error
          ok
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.verifyEmail).toEqual({
            ok: false,
            error: 'Incorrect code',
          });
        });
    });
  });
});
