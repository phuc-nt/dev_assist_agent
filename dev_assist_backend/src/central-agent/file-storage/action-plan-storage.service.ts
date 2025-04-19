import { Injectable } from '@nestjs/common';
import { ActionPlan } from '../models/action-plan.model';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { EnhancedLogger } from '../../utils/logger';

interface ActionPlanFile {
  id: string;
  userId: string;
  originalMessage: string;
  processedInput: string;
  plan: ActionPlan;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ActionPlanStorageService {
  private readonly logger = EnhancedLogger.getLogger(ActionPlanStorageService.name);
  private readonly storagePath: string;
  
  constructor() {
    // Tạo thư mục storage nếu chưa tồn tại
    this.storagePath = path.resolve(process.cwd(), 'storage', 'action-plans');
    this.initializeStorage();
  }
  
  /**
   * Khởi tạo thư mục lưu trữ
   */
  private initializeStorage(): void {
    try {
      // Tạo thư mục storage nếu chưa tồn tại
      if (!fs.existsSync(path.resolve(process.cwd(), 'storage'))) {
        fs.mkdirSync(path.resolve(process.cwd(), 'storage'));
      }
      
      // Tạo thư mục action-plans nếu chưa tồn tại
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath);
      }
      
      this.logger.log(`Khởi tạo thư mục lưu trữ tại: ${this.storagePath}`);
    } catch (error) {
      this.logger.error(`Lỗi khởi tạo thư mục lưu trữ: ${error.message}`);
    }
  }
  
  /**
   * Lưu ActionPlan vào file
   */
  async saveActionPlan(
    userId: string,
    originalMessage: string,
    processedInput: string,
    actionPlan: ActionPlan,
  ): Promise<ActionPlanFile> {
    try {
      const id = uuid.v4();
      const now = new Date().toISOString();
      
      const planFile: ActionPlanFile = {
        id,
        userId,
        originalMessage,
        processedInput,
        plan: actionPlan,
        createdAt: now,
        updatedAt: now,
      };
      
      const filePath = path.join(this.storagePath, `${id}.json`);
      fs.writeFileSync(
        filePath, 
        JSON.stringify(planFile, null, 2), 
        'utf8'
      );
      
      this.logger.log(`ActionPlan đã được lưu vào file: ${filePath}`);
      return planFile;
    } catch (error) {
      this.logger.error(`Lỗi khi lưu ActionPlan: ${error.message}`);
      throw new Error(`Không thể lưu ActionPlan: ${error.message}`);
    }
  }
  
  /**
   * Lấy ActionPlan theo ID
   */
  async getPlanById(id: string): Promise<ActionPlanFile | null> {
    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`ActionPlan với ID ${id} không tồn tại`);
        return null;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) as ActionPlanFile;
    } catch (error) {
      this.logger.error(`Lỗi khi đọc ActionPlan: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Lấy ActionPlan mới nhất của người dùng
   */
  async getLatestPlanByUserId(userId: string): Promise<ActionPlanFile | null> {
    try {
      const files = fs.readdirSync(this.storagePath);
      
      // Đọc tất cả các file và lọc theo userId
      const userPlans: ActionPlanFile[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.storagePath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const plan = JSON.parse(fileContent) as ActionPlanFile;
        
        if (plan.userId === userId) {
          userPlans.push(plan);
        }
      }
      
      if (userPlans.length === 0) {
        this.logger.warn(`Không tìm thấy ActionPlan nào cho userId ${userId}`);
        return null;
      }
      
      // Sắp xếp theo thời gian tạo mới nhất
      userPlans.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      return userPlans[0];
    } catch (error) {
      this.logger.error(`Lỗi khi tìm ActionPlan: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Cập nhật trạng thái của ActionPlan
   */
  async updatePlan(id: string, actionPlan: ActionPlan): Promise<ActionPlanFile | null> {
    try {
      const existingPlan = await this.getPlanById(id);
      
      if (!existingPlan) {
        this.logger.warn(`Không thể cập nhật: ActionPlan với ID ${id} không tồn tại`);
        return null;
      }
      
      const updatedPlan: ActionPlanFile = {
        ...existingPlan,
        plan: actionPlan,
        updatedAt: new Date().toISOString(),
      };
      
      const filePath = path.join(this.storagePath, `${id}.json`);
      fs.writeFileSync(
        filePath, 
        JSON.stringify(updatedPlan, null, 2), 
        'utf8'
      );
      
      this.logger.log(`ActionPlan ${id} đã được cập nhật`);
      return updatedPlan;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật ActionPlan: ${error.message}`);
      return null;
    }
  }
} 