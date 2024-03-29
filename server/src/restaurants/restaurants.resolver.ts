import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/common/common.types';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dtos/search-restaurants.dto';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField()
  async owner(@Parent() restaurant: Restaurant) {
    const { user } = await this.usersService.getById(restaurant.ownerId);
    return user;
  }

  @Query(() => RestaurantsOutput)
  restaurants(
    @Args('inputs') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantsService.getAllRestaurants(restaurantsInput);
  }

  @Query(() => RestaurantOutput)
  restaurant(
    @Args('inputs') restaurantInput: RestaurantInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantsService.getRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantsOutput)
  searchRestaurants(
    @Args('input') searchRestaurantsInput: SearchRestaurantsInput,
  ): Promise<SearchRestaurantsOutput> {
    return this.restaurantsService.searchRestaurants(searchRestaurantsInput);
  }

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

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Roles(Role.Owner)
  @Mutation(() => CreateDishOutput)
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantsService.createDish(owner, createDishInput);
  }

  @Roles(Role.Owner)
  @Mutation(() => EditDishOutput)
  editDish(
    @AuthUser() owner: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantsService.editDish(owner, editDishInput);
  }

  @Roles(Role.Owner)
  @Mutation(() => DeleteDishOutput)
  deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantsService.deleteDish(owner, deleteDishInput);
  }
}
