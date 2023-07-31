import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
  @Query(() => [User])
  users() {
    return this.usersService.getAllUsers();
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(@Args('input') createAccountInput: CreateAccountInput) {
    try {
      const error = await this.usersService.createAccount(createAccountInput);
      console.log('ERROR', error);
      if (error) return { ok: false, error };

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
