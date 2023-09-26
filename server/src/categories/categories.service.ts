import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { CategoriesRepository } from './categories.repository';
import { CategoriesOutput } from './dtos/categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { Category } from './entities/category.entity';
import { PAGINATION_LIMIT } from 'src/common/common.constants';
import { RestaurantsService } from 'src/restaurants/restaurants.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: CategoriesRepository,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async getAllCategories(): Promise<CategoriesOutput> {
    try {
      const categories = await this.categoriesRepository.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getCategoryBySlug({
    page,
    slug,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: { slug },
      });
      if (!category) return { ok: false, error: 'Category not found' };

      const restaurants = await this.restaurantsRepository.find({
        where: { category: { id: category.id } },
        take: PAGINATION_LIMIT,
        skip: PAGINATION_LIMIT * (page - 1),
        order: { isPromoted: 'DESC' },
      });

      const totalResults = await this.restaurantsService.getRestaurantCount(
        category,
      );
      category.restaurants = restaurants;

      return { ok: true, category, totalPages: Math.ceil(totalResults / 25) };
    } catch (error) {
      return { ok: false, error: 'Could not find category' };
    }
  }
}
