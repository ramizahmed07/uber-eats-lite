import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { CategoriesService } from './categories.service';
import { CategoriesOutput } from './dto/categories.dto';
import { CategoryInput, CategoryOutput } from './dto/category.dto';
import { Category } from './entities/category.entity';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @ResolveField(() => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantsService.getRestaurantCount(category);
  }

  @Query(() => CategoriesOutput)
  categories() {
    return this.categoriesService.getAllCategories();
  }

  @Query(() => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.categoriesService.getCategoryBySlug(categoryInput);
  }
}
