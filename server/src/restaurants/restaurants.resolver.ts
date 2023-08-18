import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/common/common.types';
import { User } from 'src/users/entities/user.entity';

import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Roles(Role.Owner)
  @Mutation(() => CreateRestaurantOutput)
  createRestaurant(
    @AuthUser() user: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantsService.createRestaurant(
      user,
      createRestaurantInput,
    );
  }

  @Roles(Role.Owner)
  @Mutation(() => EditRestaurantOutput)
  editRestaurant(
    @AuthUser() user: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantsService.editRestaurant(user, editRestaurantInput);
  }

  @Roles(Role.Owner)
  @Mutation(() => DeleteRestaurantOutput)
  deleteRestaurant(
    @AuthUser() user: User,
    @Args('input') editRestaurantInput: DeleteRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(
      user,
      editRestaurantInput.restaurantId,
    );
  }
}
