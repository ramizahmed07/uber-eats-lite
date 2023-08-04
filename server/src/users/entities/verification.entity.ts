import { Field, ObjectType } from '@nestjs/graphql';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from './user.entity';

@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Field(() => String)
  @Column()
  code: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode() {
    this.code = uuidv4();
  }
}
