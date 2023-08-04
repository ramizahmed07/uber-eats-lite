import * as bcrypt from 'bcrypt';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

import { CoreEntity } from 'src/common/entities/core.entity';
import { IsEmail, IsEnum } from 'class-validator';

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
  @IsEmail()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  verified: boolean;

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
