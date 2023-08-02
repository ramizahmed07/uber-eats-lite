import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}
  helloService() {
    console.log('HELLO RESTAURANTS');
  }
  getAll(): Promise<Restaurant[]> {
    return this.restaurantsRepository.find();
  }

  createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const newRestaurant =
      this.restaurantsRepository.create(createRestaurantDto);

    return this.restaurantsRepository.save(newRestaurant);
  }

  async updateRestaurant({ data, id }: UpdateRestaurantDto) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
    });
    if (!restaurant) return false;

    return this.restaurantsRepository.update(id, {
      ...data,
    });
  }
}
