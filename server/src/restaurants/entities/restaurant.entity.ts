import { Field, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/categories/entities/category.entity';

@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Column()
  @Field(() => String)
  name: string;

  @Column()
  @Field(() => String)
  @IsString()
  coverImage: string;

  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  address: string;

  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => Category, { nullable: true })
  category: Category;

  @ManyToOne(() => User, (user) => user.restaurants, {
    onDelete: 'CASCADE',
  })
  @Field(() => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;
}
