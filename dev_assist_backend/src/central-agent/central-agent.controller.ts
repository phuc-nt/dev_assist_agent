import { Body, Controller, Post } from '@nestjs/common';
import { CentralAgentService } from './central-agent.service';

@Controller('central-agent')
export class CentralAgentController {
  constructor(private readonly centralAgentService: CentralAgentService) {}

  @Post('process')
  async processRequest(@Body() body: { message: string, userId: string }) {
    return this.centralAgentService.processRequest(body.message, body.userId);
  }
} 