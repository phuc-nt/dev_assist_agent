import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './entity/User';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { JiraModule } from './jira/jira.module';
import { SlackModule } from './slack/slack.module';
import { CentralAgentModule } from './central-agent/central-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env toàn cục
    // Sử dụng TypeORM với SQLite trong bộ nhớ thay vì MySQL
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true,
      logging: false,
    }),
    UserModule,
    ChatModule,
    JiraModule,
    SlackModule,
    CentralAgentModule,
  ],
})
export class AppModule {}
