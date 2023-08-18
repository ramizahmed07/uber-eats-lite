import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from './entities/restaurant.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { Category } from 'src/categories/entities/category.entity';
import { CategoriesRepository } from 'src/categories/categories.repository';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,

    @InjectRepository(Category)
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurantsRepository.create(
        createRestaurantInput,
      );
      newRestaurant.owner = owner;
      const category = await this.categoriesRepository.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurantsRepository.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    { id, ...editRestaurantInput }: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (restaurant.ownerId !== owner.id)
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categoriesRepository.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurantsRepository.save([
        {
          id,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit restaurant' };
    }
  }

  async deleteRestaurant(
    user: User,
    id: number,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (restaurant.ownerId !== user.id)
        return {
          ok: false,
          error: "You can't delete restaurant that you don't own",
        };
      await this.restaurantsRepository.delete(restaurant.id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete restaurant' };
    }
  }

  getRestaurantCount(category: Category): Promise<number> {
    return this.restaurantsRepository.count({
      where: { category: { id: category.id } },
    });
  }
}
