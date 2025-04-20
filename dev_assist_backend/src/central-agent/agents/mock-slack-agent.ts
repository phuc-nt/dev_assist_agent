import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockSlackAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockSlackAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`MockSlackAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Xử lý các loại prompt khác nhau
    if (prompt.toLowerCase().includes('gửi') || prompt.toLowerCase().includes('thông báo') || prompt.toLowerCase().includes('send message')) {
      return this.mockSendMessage(prompt);
    }
    
    if (prompt.toLowerCase().includes('tìm tin nhắn') || prompt.toLowerCase().includes('tìm trao đổi') || 
        prompt.toLowerCase().includes('DEV-123') || prompt.toLowerCase().includes('task dev-123')) {
      return this.mockGetConversationForTask(prompt);
    }
    
    // Default là tìm kiếm tin nhắn
    return this.mockSearchMessages(prompt);
  }
  
  /**
   * Tìm kiếm tin nhắn
   */
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
  
  /**
   * Gửi tin nhắn
   */
  private mockSendMessage(prompt: string): StepResult {
    // Nếu là thông báo về việc cập nhật trạng thái task từ Jira
    if (prompt.toLowerCase().includes('cập nhật') && 
        (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('công việc')) &&
        (prompt.toLowerCase().includes('hoàn thành') || prompt.toLowerCase().includes('done'))) {
      
      // Tìm mã task trong prompt (pattern XDEMO2-xxx)
      const taskMatches = prompt.match(/XDEMO2-\d+/g);
      const taskIds = taskMatches ? [...new Set(taskMatches)] : ['XDEMO2-1', 'XDEMO2-3']; // Lấy unique values
      
      return {
        success: true,
        data: {
          messageId: `slack-${Date.now()}`,
          channel: "general",
          timestamp: new Date().toISOString(),
          text: `✅ Đã cập nhật ${taskIds.length} task sang trạng thái Done: ${taskIds.join(', ')}`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "✅ Cập nhật task thành công"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Đã cập nhật ${taskIds.length} task sang trạng thái *Done*:`
              }
            },
            ...taskIds.map(taskId => ({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `• *${taskId}*: Đã hoàn thành`
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Xem chi tiết"
                },
                url: `https://example.com/jira/${taskId}`
              }
            })),
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `🤖 *DevAssist Bot* | ${new Date().toLocaleString('vi-VN')}`
                }
              ]
            }
          ]
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là yêu cầu xác nhận về việc hoàn thành công việc
    if (prompt.toLowerCase().includes('hoàn thành công việc') || 
        prompt.toLowerCase().includes('xác nhận') || 
        prompt.toLowerCase().includes('cảm ơn')) {
      
      // Trích xuất nội dung tin nhắn từ prompt nếu có
      let messageContent = '';
      const matches = prompt.match(/'(.*?)'/);
      if (matches && matches.length > 1) {
        messageContent = matches[1];
      } else {
        messageContent = "Cảm ơn bạn đã thông báo. Vui lòng cung cấp thêm thông tin về công việc đã hoàn thành.";
      }
      
      return {
        success: true,
        data: {
          messageId: "slack-confirmation-123",
          channel: "direct-message",
          timestamp: new Date().toISOString(),
          text: messageContent,
          recipientId: "user123"
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là thông báo về cập nhật báo cáo trong Confluence
    if (prompt.toLowerCase().includes('báo cáo') && prompt.toLowerCase().includes('confluence')) {
      return {
        success: true,
        data: {
          messageId: `slack-report-${Date.now()}`,
          channel: "reports",
          timestamp: new Date().toISOString(),
          text: "📝 Đã cập nhật báo cáo hàng ngày trên Confluence",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "📝 *Đã cập nhật báo cáo hàng ngày*"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')} đã được cập nhật trên Confluence với những task đã hoàn thành hôm nay.`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Xem báo cáo đầy đủ tại:*"
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Xem báo cáo"
                },
                url: "https://confluence.example.com/pages/CONF-456"
              }
            }
          ]
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là thông báo về task DEV-123
    if (prompt.toLowerCase().includes('dev-123')) {
      return {
        success: true,
        data: {
          messageId: "slack-123",
          channel: "dev-team",
          timestamp: "2023-04-20T17:32:10Z",
          text: "✅ user123 đã hoàn thành task DEV-123: Implement login feature"
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Response mặc định cho các trường hợp khác
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
  
  /**
   * Lấy các tin nhắn liên quan đến một task
   */
  private mockGetConversationForTask(prompt: string): StepResult {
    // Nếu prompt đề cập đến DEV-123
    if (prompt.toLowerCase().includes('dev-123')) {
      return {
        success: true,
        data: {
          messages: [
            {
              author: "user123",
              text: "Đang gặp khó khăn với việc xử lý refresh token",
              timestamp: "2023-04-20T09:30:00Z",
              channel: "dev-team"
            },
            {
              author: "team_lead",
              text: "Thử cách này xem: https://auth0.com/docs/tokens/refresh-tokens",
              timestamp: "2023-04-20T10:15:00Z",
              channel: "dev-team"
            },
            {
              author: "user123",
              text: "Đã giải quyết được vấn đề và implement xong phần login flow",
              timestamp: "2023-04-20T14:20:00Z",
              channel: "dev-team"
            }
          ],
          channel: "dev-team",
          taskId: "DEV-123"
        },
        metadata: {
          executionTime: 380,
          tokenUsage: 160
        }
      };
    }

    // Fallback cho các task khác
    return {
      success: true,
      data: {
        messages: [
          { text: 'Tôi đang làm task này', user: 'U12345', timestamp: '2023-04-19T10:30:00Z' },
          { text: 'Cần trợ giúp về phần ABC', user: 'U12345', timestamp: '2023-04-19T11:45:00Z' },
          { text: 'Đã giải quyết được vấn đề', user: 'U12345', timestamp: '2023-04-19T15:20:00Z' }
        ],
        channel: "general",
        total: 3
      },
      metadata: {
        executionTime: 310,
        tokenUsage: 160
      }
    };
  }
} 