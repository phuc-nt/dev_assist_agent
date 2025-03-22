import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { JiraService } from './jira.service';
import { IssueData } from './interfaces';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('user/:projectIdOrKey')
  async getUserData(@Param('projectIdOrKey') projectIdOrKey: string) {
    return this.jiraService.getUserData(projectIdOrKey);
  }

  @Get('issues')
  async searchIssues(@Query('query') query: string) {
    return this.jiraService.searchIssues(query);
  }

  @Get('issue/:issueIdOrKey')
  async getIssueDetails(@Param('issueIdOrKey') issueIdOrKey: string) {
    return this.jiraService.getIssueDetails(issueIdOrKey);
  }

  @Get('issue/createmeta/issue-type/:projectIdOrKey')
  async getIssueTypeCreationMeta(
    @Param('projectIdOrKey') projectIdOrKey: string,
  ) {
    return this.jiraService.getIssueTypeCreationMeta(projectIdOrKey);
  }
  @Get('issue/createmeta/field/:projectIdOrKey/:issueTypeId')
  async getIssueCreationMeta(
    @Param('projectIdOrKey') projectIdOrKey: string,
    @Param('issueTypeId') issueTypeId: string,
  ) {
    return this.jiraService.getIssueCreationMeta(projectIdOrKey, issueTypeId);
  }

  @Get('projects')
  async getProjects() {
    return this.jiraService.getProjects();
  }
  @Post('issue')
  async createIssue(@Body() issueData: IssueData) {
    return this.jiraService.createIssue(issueData);
  }
}
