import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;

  @Column()
  @Field(() => String)
  name: string;

  @Column()
  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isVegan: boolean;

  @Column()
  @Field(() => String)
  @IsString()
  @Length(4, 1000)
  address: string;

  @Column()
  @Field(() => String)
  ownersName: string;

  @Column()
  @Field(() => String)
  categoryName: string;
}
