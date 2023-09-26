import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { Payment } from './entities/payment.entity';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';

@Module({
  imports: [RestaurantsModule, TypeOrmModule.forFeature([Payment, Restaurant])],
  providers: [PaymentsResolver, PaymentsService],
  exports: [],
})
export class PaymentsModule {}
