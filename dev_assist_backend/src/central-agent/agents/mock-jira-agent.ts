import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockJiraAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockJiraAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`MockJiraAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Xử lý dựa trên prompt
    if (prompt.toLowerCase().includes('tìm') && (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('công việc'))) {
      return this.findTasks(prompt);
    }
    
    if (prompt.toLowerCase().includes('cập nhật') || prompt.toLowerCase().includes('update')) {
      return this.updateTask(prompt);
    }
    
    if (prompt.toLowerCase().includes('tạo') || prompt.toLowerCase().includes('create')) {
      return this.createTask(prompt);
    }
    
    if (prompt.toLowerCase().includes('trạng thái') || prompt.toLowerCase().includes('status')) {
      return this.getTaskStatus(prompt);
    }
    
    if (prompt.toLowerCase().includes('báo cáo') || prompt.toLowerCase().includes('report')) {
      return this.createReport(prompt);
    }
    
    // Fallback response
    return {
      success: true,
      data: {
        message: `JIRA: ${prompt}`,
        result: "Không có thao tác cụ thể cho yêu cầu này"
      },
      metadata: {
        executionTime: 500,
        tokenUsage: 180
      }
    };
  }
  
  /**
   * Tìm kiếm các task của người dùng
   */
  private findTasks(prompt: string): StepResult {
    const userId = prompt.includes('user123') ? 'user123' : 'unknown';
    
    // Kiểm tra nếu tìm task đã hoàn thành hôm nay
    if (prompt.toLowerCase().includes('hoàn thành') && prompt.toLowerCase().includes('hôm nay')) {
      return {
        success: true,
        data: {
          tasks: [
            {
              id: 'XDEMO2-5',
              key: 'XDEMO2-5',
              summary: 'Cập nhật tài liệu API',
              status: 'Done',
              assignee: 'user123',
              dueDate: '2025-04-20',
              completedDate: '2025-04-20T14:30:00.000Z',
              priority: 'Medium',
              url: 'https://example.com/jira/XDEMO2-5'
            },
            {
              id: 'XDEMO2-7',
              key: 'XDEMO2-7', 
              summary: 'Tối ưu hiệu suất trang chủ',
              status: 'Done',
              assignee: 'user123',
              dueDate: '2025-04-21',
              completedDate: '2025-04-20T16:45:00.000Z',
              priority: 'High',
              url: 'https://example.com/jira/XDEMO2-7'
            }
          ],
          totalFound: 2,
          message: 'Đã tìm thấy 2 task hoàn thành trong ngày hôm nay'
        },
        metadata: {
          executionTime: 450,
          tokenUsage: 160
        }
      };
    }
    
    // Tìm task đang mở của người dùng
    return {
      success: true,
      data: {
        tasks: [
          {
            id: 'XDEMO2-1',
            key: 'XDEMO2-1',
            summary: 'Fix login page layout',
            status: 'In Progress',
            assignee: userId,
            dueDate: '2025-04-30',
            priority: 'High',
            url: 'https://example.com/jira/XDEMO2-1'
          },
          {
            id: 'XDEMO2-2',
            key: 'XDEMO2-2',
            summary: 'Add unit tests for auth service',
            status: 'To Do',
            assignee: userId,
            dueDate: '2025-05-05',
            priority: 'Medium',
            url: 'https://example.com/jira/XDEMO2-2'
          },
          {
            id: 'XDEMO2-3',
            key: 'XDEMO2-3',
            summary: 'Update documentation',
            status: 'In Progress',
            assignee: userId,
            dueDate: '2025-04-28',
            priority: 'Low',
            url: 'https://example.com/jira/XDEMO2-3'
          }
        ],
        totalFound: 3,
        message: `Đã tìm thấy 3 task đang mở của người dùng ${userId}`
      },
      metadata: {
        executionTime: 450,
        tokenUsage: 160
      }
    };
  }
  
  /**
   * Cập nhật trạng thái task
   */
  private updateTask(prompt: string): StepResult {
    let taskKey = '';
    let matches = prompt.match(/XDEMO2-\d+/);
    
    if (matches) {
      taskKey = matches[0];
    } else {
      // Nếu không tìm thấy mã task cụ thể, giả định là XDEMO2-5
      taskKey = 'XDEMO2-5';
    }
    
    let status = '';
    if (prompt.toLowerCase().includes('done') || prompt.toLowerCase().includes('hoàn thành')) {
      status = 'Done';
    } else if (prompt.toLowerCase().includes('in progress') || prompt.toLowerCase().includes('đang thực hiện')) {
      status = 'In Progress';
    } else if (prompt.toLowerCase().includes('to do') || prompt.toLowerCase().includes('cần làm')) {
      status = 'To Do';
    } else {
      status = 'Done'; // Mặc định là Done nếu không xác định được
    }
    
    return {
      success: true,
      data: {
        taskKey: taskKey,
        oldStatus: 'In Progress',
        newStatus: status,
        updatedBy: 'user123',
        timestamp: new Date().toISOString(),
        message: `Đã cập nhật task ${taskKey} sang trạng thái ${status}`
      },
      metadata: {
        executionTime: 600,
        tokenUsage: 190
      }
    };
  }
  
  /**
   * Tạo task mới
   */
  private createTask(prompt: string): StepResult {
    // Tạo mã task mới ngẫu nhiên
    const randomNum = Math.floor(Math.random() * 100) + 10;
    const newTaskKey = `XDEMO2-${randomNum}`;
    
    let summary = 'New task';
    if (prompt.includes(':')) {
      const parts = prompt.split(':');
      if (parts.length > 1) {
        summary = parts[1].trim();
      }
    }
    
    return {
      success: true,
      data: {
        taskKey: newTaskKey,
        summary: summary,
        status: 'To Do',
        assignee: 'user123',
        createdBy: 'user123',
        dueDate: null,
        priority: 'Medium',
        url: `https://example.com/jira/${newTaskKey}`,
        message: `Đã tạo task ${newTaskKey}: ${summary}`
      },
      metadata: {
        executionTime: 550,
        tokenUsage: 175
      }
    };
  }
  
  /**
   * Lấy trạng thái task
   */
  private getTaskStatus(prompt: string): StepResult {
    let taskKey = '';
    let matches = prompt.match(/XDEMO2-\d+/);
    
    if (matches) {
      taskKey = matches[0];
    } else {
      // Nếu không tìm thấy mã task cụ thể, giả định là XDEMO2-5
      taskKey = 'XDEMO2-5';
    }
    
    return {
      success: true,
      data: {
        taskKey: taskKey,
        status: 'In Progress',
        assignee: 'user123',
        lastUpdated: '2025-04-19T16:30:00.000Z',
        lastComment: 'Đang làm phần UI, dự kiến hoàn thành trong hôm nay',
        message: `Task ${taskKey} hiện đang ở trạng thái In Progress`
      },
      metadata: {
        executionTime: 480,
        tokenUsage: 170
      }
    };
  }
  
  /**
   * Tạo báo cáo
   */
  private createReport(prompt: string): StepResult {
    return {
      success: true,
      data: {
        reportId: `REPORT-${Date.now()}`,
        reportDate: new Date().toISOString(),
        userId: 'user123',
        completedTasks: [
          {
            id: 'XDEMO2-5',
            key: 'XDEMO2-5',
            summary: 'Cập nhật tài liệu API',
            completedDate: '2025-04-20T14:30:00.000Z'
          },
          {
            id: 'XDEMO2-7',
            key: 'XDEMO2-7', 
            summary: 'Tối ưu hiệu suất trang chủ',
            completedDate: '2025-04-20T16:45:00.000Z'
          }
        ],
        inProgressTasks: [
          {
            id: 'XDEMO2-1',
            key: 'XDEMO2-1',
            summary: 'Fix login page layout',
            dueDate: '2025-04-30'
          }
        ],
        upcomingTasks: [
          {
            id: 'XDEMO2-2',
            key: 'XDEMO2-2',
            summary: 'Add unit tests for auth service',
            dueDate: '2025-05-05'
          }
        ],
        reportContent: 'Báo cáo ngày 20/04/2025\n\nCông việc đã hoàn thành:\n- XDEMO2-5: Cập nhật tài liệu API\n- XDEMO2-7: Tối ưu hiệu suất trang chủ\n\nCông việc đang thực hiện:\n- XDEMO2-1: Fix login page layout (deadline: 30/04/2025)\n\nCông việc sắp tới:\n- XDEMO2-2: Add unit tests for auth service (deadline: 05/05/2025)',
        message: 'Đã tạo báo cáo công việc cho ngày hôm nay'
      },
      metadata: {
        executionTime: 650,
        tokenUsage: 200
      }
    };
  }
} 