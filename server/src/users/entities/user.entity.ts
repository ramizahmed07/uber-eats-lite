import * as bcrypt from 'bcrypt';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BeforeInsert, Column, Entity } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

import { CoreEntity } from 'src/common/entities/core.entity';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field(() => String)
  email: string;

  @Column()
  @Field(() => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  role: UserRole;

  @BeforeInsert()
  async hashPassword() {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
