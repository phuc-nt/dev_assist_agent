import { Controller, Get, Query } from '@nestjs/common';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get('fetch-messages')
  async fetchMessages(@Query('query') query: string, @Query('channelId') channelId: string) {
    const messages = await this.slackService.exec(query);
    return { messages };
  }
}
