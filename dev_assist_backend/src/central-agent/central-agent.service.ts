import { Injectable } from '@nestjs/common';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';
import { ActionPlanner } from './action-planner/action-planner.service';
import { ActionPlan } from './models/action-plan.model';
import { ActionPlanStorageService } from './file-storage/action-plan-storage.service';
import { EnhancedLogger } from '../utils/logger';

@Injectable()
export class CentralAgentService {
  private readonly logger = EnhancedLogger.getLogger(CentralAgentService.name);
  
  constructor(
    private readonly inputProcessor: InputProcessor,
    private readonly projectConfigReader: ProjectConfigReader,
    private readonly actionPlanner: ActionPlanner,
    private readonly actionPlanStorage: ActionPlanStorageService,
  ) {}

  async processRequest(message: string, userId: string) {
    this.logger.log(`Nhận yêu cầu mới từ userId: ${userId}, message: "${message}"`);
    
    // Đọc cấu hình dự án
    this.logger.log('Đọc cấu hình dự án...');
    const projectConfig = await this.projectConfigReader.getProjectConfig();
    this.logger.debug(`Đọc cấu hình dự án thành công: ${JSON.stringify(projectConfig, null, 2)}`);
    
    // Tìm user name
    const userName = this.findUserNameById(userId, projectConfig);
    this.logger.log(`Xác định người dùng: ${userName}`);
    
    // Tạo context cho Input Processor
    const context = {
      user: {
        id: userId,
        name: userName,
      },
      project: {
        key: projectConfig.jira.projectKey,
      },
      conversationHistory: [], // TODO: Implement conversation history
    };
    this.logger.debug(`Context cho Input Processor: ${JSON.stringify(context, null, 2)}`);
    
    // Phân tích yêu cầu
    this.logger.log('Gửi yêu cầu đến Input Processor...');
    const startTimeInput = Date.now();
    const processedInput = await this.inputProcessor.processInput(message, context);
    const inputProcessingTime = Date.now() - startTimeInput;
    this.logger.log(`Phân tích yêu cầu hoàn thành trong ${inputProcessingTime}ms`);
    this.logger.debug(`Kết quả phân tích yêu cầu: ${processedInput}`);
    
    // Lập kế hoạch hành động
    this.logger.log('Gửi yêu cầu đến Action Planner...');
    const startTimePlanning = Date.now();
    const actionPlan = await this.actionPlanner.createPlan(processedInput);
    const planningTime = Date.now() - startTimePlanning;
    this.logger.log(`Lập kế hoạch hành động hoàn thành trong ${planningTime}ms với ${actionPlan.steps.length} bước`);
    
    // Log thông tin bước trong kế hoạch
    actionPlan.steps.forEach((step, index) => {
      this.logger.debug(`Bước ${index + 1}: ${step.id}, Agent: ${step.agentType}, Phụ thuộc: ${step.dependsOn.join(', ') || 'Không'}`);
      this.logger.debug(`  Prompt: ${step.prompt}`);
    });
    
    // Lưu ActionPlan vào file
    this.logger.log('Lưu trữ ActionPlan vào file...');
    let savedPlan;
    try {
      savedPlan = await this.actionPlanStorage.saveActionPlan(
        userId,
        message,
        processedInput,
        actionPlan,
      );
      this.logger.log(`ActionPlan đã được lưu với ID: ${savedPlan.id}`);
    } catch (error) {
      this.logger.error(`Lỗi khi lưu ActionPlan: ${error.message}`);
      // Tiếp tục xử lý ngay cả khi không lưu được, nhưng ghi lại lỗi
    }
    
    // Trong phase hiện tại, chỉ trả về kết quả phân tích và kế hoạch
    this.logger.log('Hoàn thành xử lý yêu cầu');
    return {
      userId,
      originalMessage: message,
      processedInput,
      actionPlan,
      planId: savedPlan?.id, // Trả về ID của plan đã lưu nếu có
    };
  }

  /**
   * Lấy ActionPlan theo ID
   */
  async getActionPlanById(id: string) {
    this.logger.log(`Lấy ActionPlan với ID: ${id}`);
    return this.actionPlanStorage.getPlanById(id);
  }

  /**
   * Lấy ActionPlan mới nhất của người dùng
   */
  async getLatestActionPlan(userId: string) {
    this.logger.log(`Lấy ActionPlan mới nhất của userId: ${userId}`);
    return this.actionPlanStorage.getLatestPlanByUserId(userId);
  }

  private findUserNameById(userId: string, projectConfig: any): string {
    // Trong phase đầu, đơn giản hóa bằng cách trả về user đầu tiên
    return projectConfig.projectMembers[0]?.name || 'Unknown User';
  }
} 