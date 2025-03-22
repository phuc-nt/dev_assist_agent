import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class JiraService {
  private readonly host: string;
  private readonly email: string;
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.host = this.configService.get<string>('JIRA_HOST');
    this.email = this.configService.get<string>('JIRA_EMAIL');
    this.apiToken = this.configService.get<string>('JIRA_API_TOKEN');
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
}
