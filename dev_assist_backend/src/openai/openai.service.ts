import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OpenAI } from 'openai';
import { FetchDataDto, FetchDataResponseDto } from './dto/fetch-data.dto';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Định nghĩa interface cho adapter
export interface AuthAdapter {
  getAuthHeaders(): Record<string, string>;
}

// Adapter cho Jira authentication
export class JiraAuthAdapter implements AuthAdapter {
  constructor(
    private readonly email: string,
    private readonly apiToken: string,
  ) {}

  getAuthHeaders(): Record<string, string> {
    const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
    return {
      Authorization: authHeader,
      Accept: 'application/json',
    };
  }
}

// Adapter cho Slack authentication
export class SlackAuthAdapter implements AuthAdapter {
  constructor(private readonly botToken: string) {}

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.botToken}`,
      'Content-Type': 'application/json',
    };
  }
}

// Adapter mặc định (không có auth)
export class NoAuthAdapter implements AuthAdapter {
  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  private openaiModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.openaiModel = 'gpt-4o';
  }

  async chat(prompt: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error calling OpenAI: ${error.message}`);
      throw error;
    }
  }

  async chatWithFunctionCalling(systemPrompt: string, userPrompt: string) {
    try {
      const functions = [
        {
          name: 'fetchData',
          description: 'Make a request to a URL',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Full URL to get data',
              },
              method: {
                type: 'string',
                enum: ['GET', 'POST', 'PUT', 'DELETE'],
                description: 'HTTP method, default is GET',
                default: 'GET',
              },
              headers: {
                type: 'object',
                description: 'Additional headers for the request',
              },
              body: {
                type: 'object',
                description: 'Body for the request (only for POST, PUT)',
              },
              authType: {
                type: 'string',
                enum: ['none', 'jira', 'slack'],
                description: 'Type of authentication to use',
                default: 'none',
              },
            },
            required: ['url'],
          },
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: functions[0],
          },
        ],
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      // Check if there are tool_calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Prepare the messages array for the next call
        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          responseMessage,
        ];

        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let result;
          if (functionName === 'fetchData') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.fetchDataWithAuth(functionArgs);
          } else {
            // Process other functions if any
            continue;
          }

          // Add the result to the messages array
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // Call OpenAI again with all results from the functions
        const secondResponse = await this.openai.chat.completions.create({
          model: this.openaiModel,
          messages,
        });

        return secondResponse.choices[0].message.content;
      }

      return responseMessage.content;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error with function calling: ${error.message}`);
      throw error;
    }
  }

  async fetchDataWithAuth(
    fetchDataDto: FetchDataDto,
  ): Promise<FetchDataResponseDto> {
    try {
      const {
        url,
        method = 'GET',
        headers = {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body,
        authType = 'none',
      } = fetchDataDto;

      // Chọn adapter dựa trên loại xác thực
      let authAdapter: AuthAdapter;

      switch (authType) {
        case 'jira':
          authAdapter = new JiraAuthAdapter(
            this.configService.get<string>('JIRA_EMAIL'),
            this.configService.get<string>('JIRA_API_TOKEN'),
          );
          break;
        case 'slack':
          authAdapter = new SlackAuthAdapter(
            this.configService.get<string>('SLACK_BOT_TOKEN'),
          );
          break;
        default:
          authAdapter = new NoAuthAdapter();
      }

      // Lấy headers xác thực từ adapter
      const authHeaders = authAdapter.getAuthHeaders();

      const response = await firstValueFrom(
        this.httpService.request({
          url,
          method,
          headers: {
            ...authHeaders,
            ...headers,
          },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: body,
        }),
      );

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error fetching data: ${error.message}`);
      throw error;
    }
  }

  // Giữ lại phương thức nguyên bản để tương thích ngược
  async fetchData(fetchDataDto: FetchDataDto): Promise<FetchDataResponseDto> {
    return this.fetchDataWithAuth({ ...fetchDataDto });
  }
}
