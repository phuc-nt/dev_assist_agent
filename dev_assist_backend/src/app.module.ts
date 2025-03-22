import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './entity/User';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env toàn cục
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Hung@123123',
      database: 'dev-assist',
      entities: [User],
      synchronize: true, // Chỉ dùng trong môi trường dev, không nên bật ở production
    }),
    UserModule,
    ChatModule,
    SlackModule,
  ],
})
export class AppModule {}
