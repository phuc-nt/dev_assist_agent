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
    // Kiểm tra xem prompt có đề cập đến task XDEMO2 không
    const taskMatches = prompt.match(/XDEMO2-\d+/g);
    const taskIds = taskMatches ? [...new Set(taskMatches)] : [];
    
    // Tạo danh sách tin nhắn động dựa trên context
    let messages = [];
    
    // Nếu tìm thấy các task cụ thể, tạo tin nhắn liên quan đến chúng
    if (taskIds.length > 0) {
      messages = taskIds.map(taskId => {
        // Tạo các loại tin nhắn khác nhau cho mỗi task
        return {
          text: `Đã hoàn thành task ${taskId}. Code đã được review và merge.`,
          user: 'U12345',
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
          channel: 'general',
          threadTs: `${Date.now() - 3600000}.${Math.floor(Math.random() * 1000000)}`
        };
      });
    } 
    // Nếu tìm kiếm về việc hoàn thành công việc 
    else if (prompt.toLowerCase().includes('hoàn thành') || 
             prompt.toLowerCase().includes('xong việc') || 
             prompt.toLowerCase().includes('done')) {
      messages = [
        {
          text: 'Đã hoàn thành task XDEMO2-1. PR đã được merge.',
          user: 'U12345',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          channel: 'general'
        },
        {
          text: 'Đã xong task XDEMO2-2 và XDEMO2-3. Cần team review code.',
          user: 'U67890',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          channel: 'dev-team'
        },
        {
          text: 'Tôi đã hoàn thành tất cả công việc được giao hôm nay (XDEMO2-5, XDEMO2-7)',
          user: 'U12345',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          channel: 'status-updates'
        }
      ];
    }
    // Tìm kiếm mặc định
    else {
      messages = [
        {
          text: 'Đã hoàn thành task XDEMO2-1',
          user: 'U12345',
          timestamp: new Date().toISOString(),
          channel: 'general'
        },
        {
          text: 'Cần review task XDEMO2-2',
          user: 'U67890',
          timestamp: new Date().toISOString(),
          channel: 'dev-team'
        }
      ];
    }
    
    return {
      success: true,
      data: {
        messages,
        total: messages.length,
        query: prompt.substring(0, 50)
      },
      metadata: {
        executionTime: 310 + messages.length * 10,
        tokenUsage: 160 + messages.length * 20
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
    // Tìm mã task XDEMO2-xxx trong prompt
    const taskMatches = prompt.match(/XDEMO2-\d+/g);
    const taskIds = taskMatches ? [...new Set(taskMatches)] : [];
    
    // Nếu có tìm thấy task nào không
    if (taskIds.length > 0) {
      // Tạo tin nhắn cho mỗi task được đề cập
      const allMessages = taskIds.flatMap(taskId => {
        // Số id từ mã task
        const taskNumber = parseInt(taskId.split('-')[1]);
        
        // Tạo các tin nhắn liên quan đến task này
        return [
          {
            author: "user123",
            text: `Tôi bắt đầu làm task ${taskId}`,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "team_lead",
            text: `${taskId} cần được hoàn thành trước thứ 6 nhé`,
            timestamp: new Date(Date.now() - 72000000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "user123",
            text: `Đã hoàn thành task ${taskId}, PR: https://github.com/example/PR-${taskNumber}`,
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "reviewer",
            text: `Đã approve PR của task ${taskId}`,
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            channel: "dev-team"
          }
        ];
      });
      
      return {
        success: true,
        data: {
          messages: allMessages,
          channel: "dev-team",
          taskIds,
          total: allMessages.length
        },
        metadata: {
          executionTime: 380 + taskIds.length * 50,
          tokenUsage: 160 + taskIds.length * 40
        }
      };
    }
    
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

    // Fallback cho trường hợp tìm kiếm về việc hoàn thành công việc
    if (prompt.toLowerCase().includes('hoàn thành') || 
        prompt.toLowerCase().includes('xong việc') ||
        prompt.toLowerCase().includes('done')) {
      return {
        success: true,
        data: {
          messages: [
            { 
              text: 'Tôi đã hoàn thành các task XDEMO2-1, XDEMO2-3 và XDEMO2-5 hôm nay', 
              user: 'user123', 
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              channel: "status-updates"
            },
            { 
              text: 'Great job! Cần cập nhật JIRA để team biết', 
              user: 'manager', 
              timestamp: new Date(Date.now() - 3500000).toISOString(),
              channel: "status-updates" 
            },
            { 
              text: 'Đã update JIRA status rồi. Đã set các task sang Done.', 
              user: 'user123', 
              timestamp: new Date(Date.now() - 3400000).toISOString(),
              channel: "status-updates"
            }
          ],
          channel: "status-updates",
          query: "hoàn thành công việc",
          total: 3
        },
        metadata: {
          executionTime: 310,
          tokenUsage: 160
        }
      };
    }

    // Fallback cho các trường hợp khác
    return {
      success: true,
      data: {
        messages: [
          { text: 'Tôi đang làm task này', user: 'U12345', timestamp: '2023-04-19T10:30:00Z', channel: "general" },
          { text: 'Cần trợ giúp về phần ABC', user: 'U12345', timestamp: '2023-04-19T11:45:00Z', channel: "general" },
          { text: 'Đã giải quyết được vấn đề', user: 'U12345', timestamp: '2023-04-19T15:20:00Z', channel: "general" }
        ],
        channel: "general",
        total: 3,
        query: prompt.substring(0, 50)
      },
      metadata: {
        executionTime: 310,
        tokenUsage: 160
      }
    };
  }
} 