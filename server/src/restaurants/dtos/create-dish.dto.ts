import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

// @InputType()
// class Option {
//   @Field(() => String)
//   name: string;

//   @Field(() => [String], { nullable: true })
//   choices?: string[];

//   @Field(() => Number, { nullable: true })
//   extra?: number;
// }

@InputType()
export class CreateDishInput extends PickType(
  Dish,
  ['name', 'price', 'description', 'options'],
  InputType,
) {
  @Field(() => Number)
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
