import { Injectable } from '@nestjs/common';
import { AgentType, StepResult } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';

/**
 * Interface đại diện cho một Sub-Agent
 */
export interface IAgent {
  executePrompt(prompt: string, options?: any): Promise<StepResult>;
}

/**
 * Mock JIRA Agent triển khai IAgent
 */
@Injectable()
export class MockJiraAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockJiraAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`JIRA Agent executing: ${prompt}`);
    
    // Giả lập độ trễ xử lý
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    // Xử lý theo từng loại prompt dựa vào từ khóa
    if (prompt.includes('tìm') || prompt.includes('search')) {
      return this.mockSearchIssues(prompt);
    } else if (prompt.includes('cập nhật') || prompt.includes('update')) {
      return this.mockUpdateIssue(prompt);
    } else if (prompt.includes('tạo') || prompt.includes('create')) {
      return this.mockCreateIssue(prompt);
    } else {
      // Mặc định trả về thành công
      return {
        success: true,
        data: {
          message: `JIRA: Đã thực hiện: ${prompt}`,
          timestamp: new Date().toISOString()
        },
        metadata: {
          executionTime: 400,
          tokenUsage: 150
        }
      };
    }
  }
  
  private mockSearchIssues(prompt: string): StepResult {
    return {
      success: true,
      data: {
        issues: [
          { key: 'XDEMO2-1', summary: 'Fix login page layout', status: 'In Progress' },
          { key: 'XDEMO2-2', summary: 'Add unit tests for auth service', status: 'To Do' },
          { key: 'XDEMO2-3', summary: 'Update documentation', status: 'In Progress' }
        ],
        total: 3
      },
      metadata: {
        executionTime: 450,
        tokenUsage: 200
      }
    };
  }
  
  private mockUpdateIssue(prompt: string): StepResult {
    // Giả lập thất bại 10% thời gian
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Cannot transition issue to this status'
        },
        metadata: {
          executionTime: 320,
          tokenUsage: 180
        }
      };
    }
    
    return {
      success: true,
      data: {
        updated: ['XDEMO2-1'],
        message: 'Issue updated successfully'
      },
      metadata: {
        executionTime: 380,
        tokenUsage: 190
      }
    };
  }
  
  private mockCreateIssue(prompt: string): StepResult {
    return {
      success: true,
      data: {
        key: 'XDEMO2-4',
        summary: prompt.substring(0, 30) + '...',
        self: 'https://example.com/XDEMO2-4'
      },
      metadata: {
        executionTime: 520,
        tokenUsage: 210
      }
    };
  }
}

/**
 * Mock Slack Agent triển khai IAgent
 */
@Injectable()
export class MockSlackAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockSlackAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`Slack Agent executing: ${prompt}`);
    
    // Giả lập độ trễ xử lý
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Xử lý theo từng loại prompt dựa vào từ khóa
    if (prompt.includes('gửi') || prompt.includes('send')) {
      return this.mockSendMessage(prompt);
    } else if (prompt.includes('tìm') || prompt.includes('search')) {
      return this.mockSearchMessages(prompt);
    } else {
      // Mặc định trả về thành công
      return {
        success: true,
        data: {
          message: `Slack: Đã thực hiện: ${prompt}`,
          timestamp: new Date().toISOString()
        },
        metadata: {
          executionTime: 250,
          tokenUsage: 120
        }
      };
    }
  }
  
  private mockSendMessage(prompt: string): StepResult {
    // Kiểm tra nếu prompt liên quan đến các task từ JIRA
    if (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('công việc') || prompt.toLowerCase().includes('nhiệm vụ')) {
      return {
        success: true,
        data: {
          messageId: '1621234567.123456',
          channel: 'C08JFTGTN2K',
          timestamp: new Date().toISOString(),
          message: {
            text: "📋 *Thông báo về các task đang mở của bạn*",
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "📋 Danh sách các task đang mở của bạn"
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "Đây là các task đang mở trong dự án XDEMO2 cần được chú ý:"
                }
              },
              {
                type: "divider"
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "*XDEMO2-1: Fix login page layout*\n• Trạng thái: 🔄 In Progress\n• Deadline: 30/04/2025\n• Độ ưu tiên: 🔴 High"
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Xem chi tiết"
                  },
                  url: "https://example.com/jira/XDEMO2-1"
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn", 
                  text: "*XDEMO2-2: Add unit tests for auth service*\n• Trạng thái: 📝 To Do\n• Deadline: 05/05/2025\n• Độ ưu tiên: 🟠 Medium"
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Xem chi tiết"
                  },
                  url: "https://example.com/jira/XDEMO2-2"
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "*XDEMO2-3: Update documentation*\n• Trạng thái: 🔄 In Progress\n• Deadline: 28/04/2025\n• Độ ưu tiên: 🟢 Low"
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Xem chi tiết"
                  },
                  url: "https://example.com/jira/XDEMO2-3"
                }
              },
              {
                type: "divider"
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: "🤖 *DevAssist Bot* | Cập nhật lúc: " + new Date().toLocaleString('vi-VN')
                  }
                ]
              }
            ]
          }
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Response mặc định nếu không phải thông báo về task
    return {
      success: true,
      data: {
        messageId: '1621234567.123456',
        channel: 'C08JFTGTN2K',
        timestamp: new Date().toISOString(),
        message: {
          text: `Đã gửi thông báo: ${prompt.substring(0, 50)}...`
        }
      },
      metadata: {
        executionTime: 280,
        tokenUsage: 130
      }
    };
  }
  
  private mockSearchMessages(prompt: string): StepResult {
    return {
      success: true,
      data: {
        messages: [
          { text: 'Đã hoàn thành task XDEMO2-1', user: 'U12345', timestamp: new Date().toISOString() },
          { text: 'Cần review task XDEMO2-2', user: 'U67890', timestamp: new Date().toISOString() }
        ],
        total: 2
      },
      metadata: {
        executionTime: 310,
        tokenUsage: 160
      }
    };
  }
}

/**
 * Agent Factory để tạo các agent
 */
@Injectable()
export class AgentFactory {
  private readonly logger = EnhancedLogger.getLogger(AgentFactory.name);
  
  constructor(
    private readonly mockJiraAgent: MockJiraAgent,
    private readonly mockSlackAgent: MockSlackAgent,
  ) {}
  
  /**
   * Tạo agent phù hợp dựa vào loại
   */
  getAgent(agentType: AgentType): IAgent {
    this.logger.debug(`Creating agent for type: ${agentType}`);
    
    switch (agentType) {
      case AgentType.JIRA:
        return this.mockJiraAgent;
      case AgentType.SLACK:
        return this.mockSlackAgent;
      default:
        this.logger.warn(`Không có agent cho loại ${agentType}, sử dụng fallback`);
        // Fallback agent đơn giản
        return {
          executePrompt: async (prompt: string): Promise<StepResult> => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
              success: true,
              data: { message: `Default agent executed: ${prompt}` },
              metadata: { executionTime: 200, tokenUsage: 100 }
            };
          }
        };
    }
  }
  
  /**
   * Tạo mới agent theo loại
   */
  createAgent(agentType: AgentType): IAgent {
    return this.getAgent(agentType);
  }
} 