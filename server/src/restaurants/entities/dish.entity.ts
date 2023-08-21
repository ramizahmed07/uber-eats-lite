import { Field, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@ObjectType()
class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [String])
  choices: string[];

  @Field(() => Number)
  extra: number;
}

@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  @Length(5)
  name: string;

  @Column()
  @Field(() => Number)
  @IsNumber()
  price: number;

  @Column()
  @Field(() => String)
  @IsString()
  image: string;

  @Column()
  @Field(() => String)
  @IsString()
  description: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Column({ type: 'json' })
  @Field(() => [DishOption])
  options: DishOption[];
}
