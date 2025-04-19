import { Injectable } from '@nestjs/common';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';

@Injectable()
export class CentralAgentService {
  constructor(
    private readonly inputProcessor: InputProcessor,
    private readonly projectConfigReader: ProjectConfigReader,
  ) {}

  async processRequest(message: string, userId: string) {
    // Đọc cấu hình dự án
    const projectConfig = await this.projectConfigReader.getProjectConfig();
    
    // Tạo context cho Input Processor
    const context = {
      user: {
        id: userId,
        // Tìm user trong projectConfig nếu có
        name: this.findUserNameById(userId, projectConfig),
      },
      project: {
        key: projectConfig.jira.projectKey,
      },
      conversationHistory: [], // TODO: Implement conversation history
    };
    
    // Phân tích yêu cầu
    const processedInput = await this.inputProcessor.processInput(message, context);
    
    // Trong phase đầu, chỉ trả về kết quả phân tích
    return {
      userId,
      originalMessage: message,
      processedInput,
    };
  }

  private findUserNameById(userId: string, projectConfig: any): string {
    // Trong phase đầu, đơn giản hóa bằng cách trả về user đầu tiên
    return projectConfig.projectMembers[0]?.name || 'Unknown User';
  }
} 