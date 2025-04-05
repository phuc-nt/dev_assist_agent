import { Injectable, Logger } from '@nestjs/common';
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
  ChatMessage
} from './interfaces';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class JiraService {
  private readonly host: string;
  private readonly email: string;
  private readonly apiToken: string;
  private readonly jiraInstructionPrompt: string;
  private openai: OpenAI;
  private readonly logger = new Logger(JiraService.name);
  private openaiModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.host = this.configService.get<string>('JIRA_HOST');
    this.email = this.configService.get<string>('JIRA_EMAIL');
    this.apiToken = this.configService.get<string>('JIRA_API_TOKEN');

    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.openaiModel = 'gpt-4o';

    // Lấy instruction prompt và thay thế biến môi trường
    const promptTemplate = this.configService.get<string>(
      'JIRA_INSTRUCTION_PROMPT',
    );
    this.jiraInstructionPrompt = promptTemplate.replace(
      '${JIRA_HOST}',
      this.host,
    );
  }

  async chatJira(userMessages: ChatMessage[]): Promise<{ history: ChatMessage[], response: string }> {
    try {
      const systemPrompt = this.jiraInstructionPrompt;
      console.log(userMessages);
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages.map(msg => ({ 
          role: msg.role as 'user' | 'assistant', 
          content: msg.content 
        })),
      ];

      const response = await this.openai.chat.completions.create({
        model: this.openaiModel,
        messages,
        tools: functions.map(func => ({
          type: "function",
          function: func
        })
        ),
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCallMessages: ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...userMessages.map(msg => ({ 
            role: msg.role as 'user' | 'assistant', 
            content: msg.content 
          })),
          responseMessage,
        ];
        
        console.log(responseMessage.tool_calls);
        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let result;
          if (functionName === 'searchIssues') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.searchIssues(functionArgs.query);
          } else if (functionName === 'getProjects') {
            result = await this.getProjects();
          } else if (functionName === 'createIssue') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.createIssue(functionArgs);
          } else if (functionName === 'getUserData') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getUserData(functionArgs.projectIdOrKey);
          } else if (functionName === 'getIssueDetails') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueDetails(functionArgs.issueIdOrKey);
          } else if (functionName === 'getIssueTypeCreationMeta') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueTypeCreationMeta(functionArgs.projectIdOrKey);
          } else if (functionName === 'getIssueCreationMeta') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueCreationMeta(
              functionArgs.projectIdOrKey,
              functionArgs.issueTypeId
            );
          } else {
            // Process other functions if any
            continue;
          }

          // Add the result to the messages array
          toolCallMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // Call OpenAI again with all results from the functions
        const secondResponse = await this.openai.chat.completions.create({
          model: this.openaiModel,
          messages: toolCallMessages,
        });

        const assistantResponse = secondResponse.choices[0].message.content;
        
        // Create a new ChatMessage for the assistant's response
        const newAssistantMessage: ChatMessage = {
          role: 'assistant',
          content: assistantResponse
        };
        
        // Create history including tool calls and their results
        const toolCallsHistory: ChatMessage[] = [];
        
        // Add the initial assistant response with tool calls
        toolCallsHistory.push({
          role: 'assistant',
          content: JSON.stringify({
            tool_calls: responseMessage.tool_calls.map(tc => ({
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments)
            }))
          })
        });
        
        // Add tool results
        for (let i = 0; i < responseMessage.tool_calls.length; i++) {
          const toolCall = responseMessage.tool_calls[i];
          const toolResult = toolCallMessages.find(m => 
            m.role === 'tool' && m.tool_call_id === toolCall.id
          );
          
          if (toolResult) {
            toolCallsHistory.push({
              role: 'tool',
              content: typeof toolResult.content === 'string' 
                ? toolResult.content 
                : JSON.stringify(toolResult.content)
            });
          }
        }
        
        // Return both history and response
        return {
          history: [...userMessages, ...toolCallsHistory, newAssistantMessage],
          response: assistantResponse
        };
      }

      const assistantResponse = responseMessage.content;
      
      // Create a new ChatMessage for the assistant's response
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantResponse
      };
      
      // Return both history and response
      return {
        history: [...userMessages, newAssistantMessage],
        response: assistantResponse
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error with function calling: ${error.message}`);
      throw error;
    }
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
      this.logger.error(`Error getting user data: ${error.message}`);
      throw new Error('Không thể lấy thông tin người dùng. Vui lòng kiểm tra quyền truy cập.');
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
      this.logger.error(`Error searching issues: ${error.message}`);
      throw new Error('Không thể tìm kiếm các vấn đề. Vui lòng thử lại sau.');
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
      this.logger.error(`Error getting issue details: ${error.message}`);
      throw new Error('Không thể lấy chi tiết vấn đề. Vui lòng kiểm tra ID và quyền truy cập.');
    }
  }

  async createIssue(issueData: IssueData): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Tách dữ liệu cho trường fields
      const fieldsData = {
        project: {
          key: issueData.project,
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
      this.logger.error(`Error creating issue: ${error.message}`);
      throw new Error('Không thể tạo vấn đề mới. Vui lòng kiểm tra thông tin đã nhập.');
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
      this.logger.error(`Error getting issue type metadata: ${error}`);
      // console.log(error);
      throw new Error('Không thể lấy thông tin loại vấn đề. Vui lòng kiểm tra dự án.');
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
      this.logger.error(`Error getting issue creation metadata: ${error.message}`);
      throw new Error('Không thể lấy thông tin trường dữ liệu. Vui lòng kiểm tra dự án và loại vấn đề.');
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
      this.logger.error(`Error getting projects: ${error.message}`);
      throw new Error('Không thể lấy danh sách dự án. Vui lòng kiểm tra quyền truy cập.');
    }
  }


}

const functions = [

  {
    name: 'searchIssues',
    description: 'Search for Jira issues by query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for Jira issues',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getProjects',
    description: 'Get list of all accessible Jira projects',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createIssue',
    description: 'Create a new Jira issue',
    parameters: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project key',
        },
        issueTypeId: {
          type: 'string',
          description: 'Issue type ID',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        reporterAccountId: {
          type: 'string',
          description: 'Account ID of the reporter',
        },
        description: {
          type: 'string',
          description: 'Issue description',
        },
      },
      required: ['projectId', 'issueTypeId', 'summary', 'reporterAccountId'],
    },
  },
  {
    name: 'getUserData',
    description: 'Get user data for a specific Jira project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key to get user data from',
        },
      },
      required: ['projectIdOrKey'],
    },
  },
  {
    name: 'getIssueDetails',
    description: 'Get detailed information about a specific Jira issue',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'Issue ID or key to get details for',
        },
      },
      required: ['issueIdOrKey'],
    },
  },
  {
    name: 'getIssueTypeCreationMeta',
    description: 'Get metadata about issue types available for a project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key to get issue type metadata for',
        },
      },
      required: ['projectIdOrKey'],
    },
  },
  {
    name: 'getIssueCreationMeta',
    description: 'Get metadata about fields available for a specific issue type in a project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key',
        },
        issueTypeId: {
          type: 'string',
          description: 'Issue type ID to get field metadata for',
        },
      },
      required: ['projectIdOrKey', 'issueTypeId'],
    },
  }
];