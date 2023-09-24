import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { Role } from 'src/common/common.types';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Roles(Role.Client)
  @Mutation(() => CreateOrderOutput)
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
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

  @Roles(Role.Owner)
  @Subscription(() => Order, {
    filter: ({ pendingOrders: { ownerId } }, _, { user }) =>
      ownerId === user.id,
    resolve: ({ pendingOrders: { order } }) => order,
  })
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Roles(Role.Delivery)
  @Subscription(() => Order, {
    resolve: ({ cookedOrders: { order } }) => order,
  })
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Roles(Role.Client, Role.Delivery, Role.Owner)
  @Subscription(() => Order, {
    filter(
      { orderUpdates }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) {
      const isAuthorized =
        user.id === orderUpdates.customerId ||
        user.id === orderUpdates.riderId ||
        user.id === orderUpdates.restaurant.ownerId;
      return isAuthorized && orderUpdates.id === input.id;
    },
  })
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }

  @Roles(Role.Delivery)
  @Mutation(() => TakeOrderOutput)
  takeOrder(
    @AuthUser() user: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ) {
    return this.ordersService.takeOrder(user, takeOrderInput);
  }
}
