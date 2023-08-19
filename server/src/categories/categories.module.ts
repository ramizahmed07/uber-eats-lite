import { forwardRef, Module } from '@nestjs/common';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { customCategoriesRepository } from './categories.repository';
import { Category } from './entities/category.entity';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Module({
  imports: [
    forwardRef(() => RestaurantsModule),
    TypeOrmModule.forFeature([Restaurant]),
  ],
  providers: [
    {
      provide: getRepositoryToken(Category),
      useFactory(datasource: DataSource) {
        return datasource
          .getRepository(Category)
          .extend(customCategoriesRepository);
      },
      inject: [getDataSourceToken()],
    },
    CategoriesResolver,
    CategoriesService,
  ],
  exports: [
    {
      provide: getRepositoryToken(Category),
      useFactory(datasource: DataSource) {
        return datasource
          .getRepository(Category)
          .extend(customCategoriesRepository);
      },
      inject: [getDataSourceToken()],
    },
  ],
})
export class CategoriesModule {}
