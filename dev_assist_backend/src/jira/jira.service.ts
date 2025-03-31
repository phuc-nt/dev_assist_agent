import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import {
  IssueType,
  MetaResponseData,
  IssueData,
  RoleData,
  UserData,
} from './interfaces';
import { OpenaiService } from '../openai/openai.service';
@Injectable()
export class JiraService {
  private readonly host: string;
  private readonly email: string;
  private readonly apiToken: string;
  private readonly jiraInstructionPrompt: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly openaiService: OpenaiService,
  ) {
    this.host = this.configService.get<string>('JIRA_HOST');
    this.email = this.configService.get<string>('JIRA_EMAIL');
    this.apiToken = this.configService.get<string>('JIRA_API_TOKEN');

    // Lấy instruction prompt và thay thế biến môi trường
    const promptTemplate = this.configService.get<string>(
      'JIRA_INSTRUCTION_PROMPT',
    );
    this.jiraInstructionPrompt = promptTemplate.replace(
      '${JIRA_HOST}',
      this.host,
    );
  }
  async chatJira(message: string): Promise<any> {
    const response = await this.openaiService.chatWithFunctionCalling(
      this.jiraInstructionPrompt,
      message,
    );
    return response;
  }

  async getUserData(projectIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response1: AxiosResponse<RoleData> = await firstValueFrom(
        this.httpService.get(
          `${this.host}/rest/api/3/project/${projectIdOrKey}/role`,
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          },
        ),
      );

      const roles = response1.data;
      const adminRoleId = roles?.Administrator?.split('/')?.pop();
      const memberRoleId = roles?.Member?.split('/')?.pop();

      const adminResponse: AxiosResponse<{ actors: UserData[] }> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/project/${projectIdOrKey}/role/${adminRoleId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      const memberResponse: AxiosResponse<{ actors: UserData[] }> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/project/${projectIdOrKey}/role/${memberRoleId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      const combinedMembers = [
        ...adminResponse.data.actors,
        ...memberResponse.data.actors,
      ];

      const filteredMembers = combinedMembers.map((user: UserData) => ({
        displayName: user.displayName,
        accountId: user.actorUser.accountId,
      }));

      return filteredMembers;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
      throw error;
    }
  }
  async searchIssues(query: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/picker`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          params: {
            query: query,
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Lỗi khi fetch dữ liệu:', error);
      throw error;
    }
  }

  async getIssueDetails(issueIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/${issueIdOrKey}`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết issue:', error);
      throw error;
    }
  }

  async createIssue(issueData: IssueData): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Tách dữ liệu cho trường fields
      const fieldsData = {
        project: {
          key: issueData.projectId,
        },
        issuetype: {
          id: issueData.issueTypeId,
        },
        summary: issueData.summary,
        reporter: {
          accountId: issueData.reporterAccountId,
        },
      };

      // Tạo issue
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.host}/rest/api/3/issue`,
          { fields: fieldsData },
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo issue:', error);
      throw error;
    }
  }
  async getIssueTypeCreationMeta(projectIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Lấy metadata cần thiết để tạo issue
      const metaResponse: AxiosResponse<MetaResponseData> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/issue/createmeta/${projectIdOrKey}/issuetypes`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      // Trả về metadata của project
      return metaResponse.data;
    } catch (error) {
      console.error('Lỗi khi lấy metadata tạo issue:', error);
      throw error;
    }
  }
  async getIssueCreationMeta(
    projectIdOrKey: string,
    issueTypeId: string,
  ): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Lấy metadata cần thiết để tạo issue
      const metaResponse: AxiosResponse<MetaResponseData> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/issue/createmeta/${projectIdOrKey}/issuetypes/${issueTypeId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      // Trả về metadata của project
      return metaResponse.data;
    } catch (error) {
      console.error('Lỗi khi lấy metadata tạo issue:', error);
      throw error;
    }
  }

  async getProjects(): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/project/search`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách project:', error);
      throw error;
    }
  }
}
