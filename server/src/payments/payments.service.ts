import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly restaurantsService: RestaurantsService,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { restaurantId, transactionId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const { ok, restaurant } =
        await this.restaurantsService.getRestaurantById({ restaurantId });
      if (!ok) return { ok: false, error: 'Restaurant not found' };
      if (owner.id !== restaurant.ownerId)
        return { ok: false, error: 'Not authorized' };

      await this.paymentsRepository.save(
        this.paymentsRepository.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.isPromoted = true;
      restaurant.promotedUntil = date;
      await this.restaurantsRepository.save(restaurant);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '' };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.paymentsRepository.find({
        where: {
          userId: user.id,
        },
      });

      return { ok: true, payments };
    } catch (error) {
      return { ok: false, error: 'Could not load the payments' };
    }
  }
}
