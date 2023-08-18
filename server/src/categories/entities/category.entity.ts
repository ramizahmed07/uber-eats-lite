import { Field, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  name: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  image: string;

  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  slug: string;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
  @Field(() => [Restaurant])
  restaurants: Restaurant[];
}
