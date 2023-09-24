import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';

import { User } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Role } from 'src/common/common.types';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { TakeOrderInput } from './dtos/take-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishesRepository: Repository<Dish>,
    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { items, restaurantId }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      let total = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishesRepository.findOne({
          where: { id: item.dishId },
        });
        if (!dish) return { ok: false, error: 'Dish not found' };
        total += dish.price;
        for (const option of item.options) {
          dish.options.forEach((dishOption) => {
            if (dishOption.name === option.name && dishOption.extra) {
              total += dishOption?.extra;
            }

            dishOption?.choices &&
              dishOption?.choices.forEach((choice) => {
                if (choice.name === option.choice && choice.extra) {
                  total += choice.extra;
                }
              });
          });
        }

        const orderItem = await this.orderItemsRepository.save(
          this.orderItemsRepository.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      const order = await this.ordersRepository.save(
        this.ordersRepository.create({
          restaurant,
          customer,
          total,
          items: orderItems,
        }),
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create the order' };
    }
  }

  async getOrders(
    customer: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];

      if (customer.role === Role.Client) {
        orders = await this.ordersRepository.find({
          where: {
            customer: {
              id: customer.id,
            },
            ...(status && { status }),
          },
        });
      }
      if (customer.role === Role.Delivery) {
        orders = await this.ordersRepository.find({
          where: {
            rider: {
              id: customer.id,
            },
            ...(status && { status }),
          },
        });
      }
      if (customer.role === Role.Owner) {
        const restaurants = await this.restaurantsRepository.find({
          where: {
            owner: {
              id: customer.id,
            },
          },
          relations: ['orders'],
          select: {
            orders: true,
          },
        });

        orders = restaurants.map((restaurant) => restaurant.orders).flat();
        if (status) orders = orders.filter((order) => order.status === status);
      }
      return { ok: true, orders };
    } catch (error) {
      return { ok: false, error: 'Could not get the orders' };
    }
  }

  isAuthorized(user: User, order: Order): boolean {
    let isAuthorized = false;
    if (user.role === Role.Client && order.customerId === user.id)
      isAuthorized = true;
    if (user.role === Role.Delivery && order.riderId === user.id)
      isAuthorized = true;
    if (user.role === Role.Owner && order.restaurant.ownerId === user.id)
      isAuthorized = true;

    return isAuthorized;
  }

  async getOrder(
    customer: User,
    { id }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id },
        relations: ['restaurant'],
      });
      if (!order) return { ok: false, error: 'Order not found' };

      if (!this.isAuthorized(customer, order))
        return { ok: false, error: 'Not authorized' };

      return { ok: true, order };
    } catch (error) {
      return { ok: false, error: 'Could not get the order' };
    }
  }

  async editOrder(
    user: User,
    { id, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      if (user.role === Role.Client)
        return { ok: false, error: 'Not authorized' };

      const order = await this.ordersRepository.findOne({
        where: {
          id,
        },
        relations: ['restaurant'],
      });
      if (!order) return { ok: false, error: 'Order not found' };
      if (!this.isAuthorized(user, order))
        return { ok: false, error: 'Not authorized' };
      let canEdit = true;
      if (user.role === Role.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked)
          canEdit = false;
      } else {
        if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered)
          canEdit = false;
      }

      if (!canEdit) return { ok: false, error: 'Invalid status' };

      await this.ordersRepository.update(id, {
        status,
      });
      const updatedOrder = { ...order, status };
      if (
        user.role === Role.Owner &&
        updatedOrder.status === OrderStatus.Cooked
      ) {
        await this.pubSub.publish(NEW_COOKED_ORDER, {
          cookedOrders: { order: updatedOrder },
        });
      }
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: updatedOrder,
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit the order' };
    }
  }

  async takeOrder(rider: User, { id }: TakeOrderInput) {
    try {
      const order = await this.ordersRepository.findOne({ where: { id: id } });
      if (!order) return { ok: false, error: 'Order not found' };
      if (order.rider) return { ok: false, error: 'Order already has a rider' };
      await this.ordersRepository.update(id, {
        rider,
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, rider },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not take the order' };
    }
  }
}
