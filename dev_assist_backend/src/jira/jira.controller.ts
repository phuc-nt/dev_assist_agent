import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { JiraService } from './jira.service';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('issues')
  async searchIssues(@Query('query') query: string) {
    return this.jiraService.searchIssues(query);
  }
}
