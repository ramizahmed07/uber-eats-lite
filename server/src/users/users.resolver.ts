import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Query(() => User)
  me(@AuthUser() user: User) {
    return user;
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(@Args('input') createAccountInput: CreateAccountInput) {
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @UseGuards(AuthGuard)
  @Query(() => UserProfileOutput)
  userProfile(@Args() userProfileInput: UserProfileInput) {
    return this.usersService.getUserProfile(userProfileInput);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  editProfile(
    @AuthUser() user: User,
    @Args('input') editProfileInput: EditProfileInput,
  ) {
    return this.usersService.editUserProfile(user, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(@Args('input') verifyEmailInput: VerifyEmailInput) {
    return this.usersService.verifyEmail(verifyEmailInput);
  }
}
