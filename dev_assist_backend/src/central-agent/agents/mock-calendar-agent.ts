import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockCalendarAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockCalendarAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`MockCalendarAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Xử lý dựa trên prompt
    if (prompt.toLowerCase().includes('tạo cuộc họp') || prompt.toLowerCase().includes('lên lịch') || 
        prompt.toLowerCase().includes('đặt lịch') || prompt.toLowerCase().includes('create meeting')) {
      return this.mockCreateMeeting(prompt);
    }
    
    if (prompt.toLowerCase().includes('kiểm tra phòng') || prompt.toLowerCase().includes('phòng họp')) {
      if (prompt.toLowerCase().includes('phòng họp b')) {
        return this.mockCheckRoomAvailability('B', false);
      } else {
        return this.mockCheckRoomAvailability('A', true);
      }
    }
    
    if (prompt.toLowerCase().includes('danh sách phòng trống') || prompt.toLowerCase().includes('available rooms')) {
      return this.mockGetAvailableRooms(prompt);
    }
    
    // Fallback response
    return {
      success: true,
      data: {
        message: `Calendar: ${prompt}`,
        result: "Không có thao tác cụ thể"
      },
      metadata: {
        executionTime: 400,
        tokenUsage: 150
      }
    };
  }
  
  /**
   * Mock tạo cuộc họp mới
   */
  private mockCreateMeeting(prompt: string): StepResult {
    const meetingId = 'meeting_' + Date.now().toString().slice(-6);
    
    return {
      success: true,
      data: {
        meetingId: meetingId,
        title: this.extractMeetingTitle(prompt),
        dateTime: this.extractDateTime(prompt),
        attendees: this.extractAttendees(prompt),
        location: this.extractLocation(prompt),
        meetingUrl: `https://meet.example.com/${meetingId}`,
        calendarEvent: {
          id: `event_${Date.now().toString().slice(-6)}`,
          htmlLink: `https://calendar.example.com/event/${meetingId}`
        }
      },
      metadata: {
        executionTime: 650,
        tokenUsage: 280
      }
    };
  }
  
  /**
   * Mock kiểm tra phòng họp có trống hay không
   */
  private mockCheckRoomAvailability(room: string, isAvailable: boolean): StepResult {
    if (isAvailable) {
      return {
        success: true,
        data: {
          room: `Phòng họp ${room}`,
          available: true,
          nextAvailableTime: null
        },
        metadata: {
          executionTime: 420,
          tokenUsage: 120
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'ROOM_UNAVAILABLE',
          message: `Phòng họp ${room} đã được đặt vào thời gian này`,
          availableRooms: ['Phòng họp A', 'Phòng họp C', 'Phòng họp D'],
          nextAvailableTime: this.getNextAvailableTime()
        },
        metadata: {
          executionTime: 420,
          tokenUsage: 120
        }
      };
    }
  }
  
  /**
   * Mock lấy danh sách phòng họp trống
   */
  private mockGetAvailableRooms(prompt: string): StepResult {
    return {
      success: true,
      data: {
        availableRooms: [
          { name: 'Phòng họp A', capacity: 10, features: ['Projector', 'Whiteboard'] },
          { name: 'Phòng họp C', capacity: 6, features: ['TV', 'Whiteboard'] },
          { name: 'Phòng họp D', capacity: 20, features: ['Projector', 'Whiteboard', 'Video Conference'] }
        ],
        date: this.extractDate(prompt),
        timeSlot: this.extractTimeSlot(prompt)
      },
      metadata: {
        executionTime: 480,
        tokenUsage: 200
      }
    };
  }
  
  // Các phương thức hỗ trợ
  private extractMeetingTitle(prompt: string): string {
    if (prompt.toLowerCase().includes('demo')) return 'Demo dự án';
    if (prompt.toLowerCase().includes('review')) return 'Review code';
    if (prompt.toLowerCase().includes('kick-off')) return 'Kick-off meeting';
    return 'Cuộc họp mới';
  }
  
  private extractDateTime(prompt: string): string {
    // Chỉ ví dụ, trong thực tế cần phân tích phức tạp hơn
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (prompt.toLowerCase().includes('tomorrow') || prompt.toLowerCase().includes('mai')) {
      return tomorrow.toISOString();
    }
    
    // Mặc định là thứ 6 tuần này
    const friday = new Date(now);
    const currentDay = friday.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = currentDay <= 5 ? 5 - currentDay : 6; // Calculate days to next Friday
    friday.setDate(friday.getDate() + daysToAdd);
    friday.setHours(10, 0, 0, 0); // 10 AM
    
    return friday.toISOString();
  }
  
  private extractDate(prompt: string): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  private extractTimeSlot(prompt: string): string {
    if (prompt.toLowerCase().includes('chiều') || prompt.toLowerCase().includes('afternoon')) {
      return '14:00-15:00';
    }
    return '10:00-11:00';
  }
  
  private extractAttendees(prompt: string): string[] {
    if (prompt.toLowerCase().includes('team backend')) {
      return ['user123', 'user456', 'backend-lead'];
    }
    if (prompt.toLowerCase().includes('frontend')) {
      return ['user789', 'frontend-lead', 'designer'];
    }
    return ['user123', 'default-attendee'];
  }
  
  private extractLocation(prompt: string): string {
    if (prompt.toLowerCase().includes('phòng họp a')) return 'Phòng họp A';
    if (prompt.toLowerCase().includes('phòng họp b')) return 'Phòng họp B';
    if (prompt.toLowerCase().includes('phòng họp c')) return 'Phòng họp C';
    return 'Phòng họp A'; // default
  }
  
  private getNextAvailableTime(): string {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 2);
    nextHour.setMinutes(0, 0, 0);
    return nextHour.toISOString();
  }
} 