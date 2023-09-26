import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/common/common.types';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(Role.Owner)
  @Mutation(() => CreatePaymentOutput)
  createPayment(
    @AuthUser() user: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ) {
    return this.paymentsService.createPayment(user, createPaymentInput);
  }

  @Query(() => GetPaymentsOutput)
  getPayments(@AuthUser() user: User) {
    return this.paymentsService.getPayments(user);
  }
}
