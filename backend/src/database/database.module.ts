import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Tenant, User, Subscription, TenantInvite } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        entities: [Tenant, User, Subscription, TenantInvite],
        synchronize: ['development', 'test'].includes(
          config.get<string>('app.environment') ?? 'development',
        ),
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: config.get<string>('app.environment') === 'production',
        logging: config.get<string>('app.environment') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Tenant, User, Subscription, TenantInvite]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
