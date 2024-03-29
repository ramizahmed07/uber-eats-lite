import * as bcrypt from 'bcrypt';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsEnum } from 'class-validator';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Role } from 'src/common/common.types';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

registerEnumType(Role, { name: 'Role' });

@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role })
  @Field(() => Role)
  @IsEnum(Role)
  role: Role;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  verified: boolean;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  @Field(() => [Restaurant])
  restaurants: Restaurant[];

  @OneToMany(() => Order, (order) => order.customer)
  @Field(() => [Order])
  orders: Order[];

  @OneToMany(() => Payment, (payment) => payment.user)
  @Field(() => [Payment])
  payments: Payment[];

  @OneToMany(() => Order, (order) => order.rider)
  @Field(() => [Order])
  rides: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    try {
      if (!this.password) return;
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
