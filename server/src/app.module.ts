import * as Joi from 'joi';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { User } from './users/entities/user.entity';
import { Verification } from './users/entities/verification.entity';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './categories/entities/category.entity';
import { JwtModule } from './jwt/jwt.module';
import { MailModule } from './mail/mail.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { CommonModule } from './common/common.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: async (connectionParams) => ({
            token: connectionParams['X-JWT'],
          }),
        },
        'graphql-ws': {
          onConnect: async ({ connectionParams }) => {
            /* @Todo - may cause error from client */
            console.log('connectionParams 2.0', connectionParams);
            return {
              token: connectionParams['X-JWT'],
            };
          },
        },
      },
      autoSchemaFile: true,
      context: ({ req }) => ({ token: req.headers['x-jwt'] }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      ignoreEnvFile: ENV === 'production',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        SECRET_KEY: Joi.string().required(),
        SENDGRID_API_KEY: Joi.string().required(),
        TEMPLATE_ID: Joi.string().required(),
        SENDGRID_SENDER_EMAIL: Joi.string().required().email(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: ENV !== 'production',
      logging: ENV === 'development',
      entities: [
        User,
        Verification,
        Category,
        Restaurant,
        Dish,
        Order,
        OrderItem,
        Payment,
      ],
    }),
    JwtModule.forRoot({
      secretKey: process.env.SECRET_KEY,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    CategoriesModule,
    MailModule,
    OrdersModule,
    CommonModule,
    PaymentsModule,
  ],
})
export class AppModule {}
