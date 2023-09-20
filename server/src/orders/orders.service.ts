import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Order } from './entities/order.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Role } from 'src/common/common.types';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';

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
            if (dishOption.name === option.name && dishOption.extra)
              total += dishOption.extra;
            dishOption.choices.forEach((choice) => {
              if (choice.name === option.choice && choice.extra)
                total += choice.extra;
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
      await this.ordersRepository.save(
        this.ordersRepository.create({
          restaurant,
          customer,
          total,
          items: orderItems,
        }),
      );
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

      if (
        order.customerId !== customer.id &&
        order.riderId !== customer.id &&
        order.restaurant.ownerId !== customer.id
      )
        return { ok: false, error: 'Not authorized' };

      return { ok: true, order };
    } catch (error) {
      return { ok: false, error: 'Could not get the order' };
    }
  }
}
