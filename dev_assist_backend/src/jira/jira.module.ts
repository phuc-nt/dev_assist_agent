import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  providers: [JiraService],
  controllers: [JiraController],
})
export class JiraModule {}
