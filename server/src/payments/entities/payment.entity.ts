import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(() => String)
  @Column()
  transactionId: string;

  @ManyToOne(() => User, (user) => user.payments)
  @Field(() => User)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @ManyToOne(() => Restaurant)
  @Field(() => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
