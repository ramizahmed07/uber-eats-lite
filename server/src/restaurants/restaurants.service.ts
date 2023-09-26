import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

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
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { PAGINATION_LIMIT } from 'src/common/common.constants';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dtos/search-restaurants.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,

    @InjectRepository(Category)
    private readonly categoriesRepository: CategoriesRepository,

    @InjectRepository(Dish)
    private readonly dishesRepository: Repository<Dish>,
  ) {}

  async getAllRestaurants({
    page,
  }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantsRepository.findAndCount({
          take: PAGINATION_LIMIT,
          skip: (page - 1) * PAGINATION_LIMIT,
        });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / PAGINATION_LIMIT),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not get restaurants' };
    }
  }

  async getRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };

      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return { ok: false, error: 'Could not get restaurant' };
    }
  }

  async searchRestaurants({
    page,
    query,
  }: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantsRepository.findAndCount({
          where: { name: ILike(`%${query}%`) },
          take: PAGINATION_LIMIT,
          skip: (page - 1) * PAGINATION_LIMIT,
        });

      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error: 'Could not search for restaurants' };
    }
  }

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

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id: createDishInput.restaurantId },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (owner.id !== restaurant.ownerId)
        return { ok: false, error: 'Not authorized' };
      await this.dishesRepository.save(
        this.dishesRepository.create({ ...createDishInput, restaurant }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create the dish" };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishesRepository.findOne({
        where: {
          id: editDishInput.id,
        },
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (dish.restaurant.ownerId !== owner.id)
        return { ok: false, error: 'Not authorized' };
      await this.dishesRepository.save([
        {
          id: editDishInput.id,
          ...this.dishesRepository.create(editDishInput),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit the dish' };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishesRepository.findOne({
        where: {
          id: dishId,
        },
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (dish.restaurant.ownerId !== owner.id)
        return { ok: false, error: 'Not authorized' };
      await this.dishesRepository.delete(dishId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete the dish' };
    }
  }
}
