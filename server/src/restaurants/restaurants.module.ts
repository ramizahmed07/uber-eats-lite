import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesModule } from 'src/categories/categories.module';
import { UsersModule } from 'src/users/users.module';
import { Category } from 'src/categories/entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurants.service';
import { DishResolver, RestaurantsResolver } from './restaurants.resolver';

@Module({
  imports: [
    forwardRef(() => CategoriesModule),
    UsersModule,
    TypeOrmModule.forFeature([Restaurant, Category, Dish]),
  ],
  providers: [RestaurantsResolver, DishResolver, RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
