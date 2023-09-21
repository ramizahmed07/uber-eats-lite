import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/common/common.types';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.Client)
  @Mutation(() => CreateOrderOutput)
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
    console.log('ROLE', customer.role);
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Roles(Role.Client, Role.Delivery, Role.Owner)
  @Query(() => GetOrdersOutput)
  orders(
    @AuthUser() customer: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ) {
    return this.ordersService.getOrders(customer, getOrdersInput);
  }

  @Roles(Role.Client, Role.Delivery, Role.Owner)
  @Query(() => GetOrderOutput)
  order(
    @AuthUser() customer: User,
    @Args('input') getOrderInput: GetOrderInput,
  ) {
    return this.ordersService.getOrder(customer, getOrderInput);
  }

  @Roles(Role.Client, Role.Delivery, Role.Owner)
  @Mutation(() => EditOrderOutput)
  editOrder(
    @AuthUser() customer: User,
    @Args('input') editOrderInput: EditOrderInput,
  ) {
    return this.ordersService.editOrder(customer, editOrderInput);
  }
}
