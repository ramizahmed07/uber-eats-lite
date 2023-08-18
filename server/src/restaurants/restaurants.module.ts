import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesModule } from 'src/categories/categories.module';
import { Category } from 'src/categories/entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsResolver } from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [
    forwardRef(() => CategoriesModule),
    TypeOrmModule.forFeature([Restaurant, Category]),
  ],
  providers: [RestaurantsResolver, RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
