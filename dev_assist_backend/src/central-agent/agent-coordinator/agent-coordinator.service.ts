import { Injectable } from '@nestjs/common';
import { ActionPlan, ActionStep, StepStatus, PlanStatus, StepResult } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';
import { AgentFactory } from '../agent-factory/agent-factory.service';

@Injectable()
export class AgentCoordinator {
  private readonly logger = EnhancedLogger.getLogger(AgentCoordinator.name);
  
  constructor(private readonly agentFactory: AgentFactory) {}
  
  /**
   * Thực thi kế hoạch hành động
   */
  async executePlan(actionPlan: ActionPlan): Promise<ActionPlan> {
    this.logger.log(`Bắt đầu thực thi kế hoạch với ${actionPlan.steps.length} bước`);
    
    try {
      // Khởi tạo thời gian bắt đầu và trạng thái
      actionPlan.startTime = new Date();
      actionPlan.status = PlanStatus.RUNNING;
      
      // Thực thi từng bước trong kế hoạch
      while (this.hasStepsToExecute(actionPlan)) {
        const nextSteps = this.getNextStepsToExecute(actionPlan);
        
        // Không còn bước nào để thực hiện
        if (nextSteps.length === 0) {
          this.logger.warn('Không có bước nào có thể thực hiện tiếp, nhưng kế hoạch chưa hoàn thành');
          break;
        }
        
        this.logger.debug(`Thực hiện ${nextSteps.length} bước tiếp theo: ${nextSteps.map(i => actionPlan.steps[i].id).join(', ')}`);
        
        // Thực thi song song các bước có thể thực hiện
        await Promise.all(
          nextSteps.map(stepIndex => this.executeStep(actionPlan, stepIndex))
        );
        
        // Cập nhật tiến độ
        actionPlan.overallProgress = this.calculateProgress(actionPlan);
      }
      
      // Cập nhật trạng thái cuối cùng
      actionPlan.endTime = new Date();
      
      if (this.allStepsCompleted(actionPlan)) {
        actionPlan.status = PlanStatus.COMPLETED;
        this.logger.log('Kế hoạch đã hoàn thành thành công');
      } else {
        actionPlan.status = PlanStatus.FAILED;
        this.logger.error('Kế hoạch thất bại do một số bước không thành công');
      }
      
      return actionPlan;
      
    } catch (error) {
      this.logger.error(`Lỗi khi thực thi kế hoạch: ${error.message}`);
      actionPlan.status = PlanStatus.FAILED;
      actionPlan.error = error;
      actionPlan.endTime = new Date();
      return actionPlan;
    }
  }
  
  /**
   * Kiểm tra xem kế hoạch còn bước nào cần thực hiện không
   */
  private hasStepsToExecute(plan: ActionPlan): boolean {
    return plan.steps.some(step => 
      [StepStatus.PENDING, StepStatus.WAITING, StepStatus.RETRYING].includes(step.status)
    );
  }
  
  /**
   * Lấy danh sách các bước tiếp theo có thể thực hiện
   * Một bước có thể thực hiện khi:
   * 1. Trạng thái là PENDING hoặc RETRYING
   * 2. Tất cả các bước phụ thuộc đã hoàn thành (SUCCEEDED)
   */
  private getNextStepsToExecute(plan: ActionPlan): number[] {
    return plan.steps.reduce((executables, step, index) => {
      if ([StepStatus.PENDING, StepStatus.RETRYING, StepStatus.WAITING].includes(step.status)) {
        const dependenciesCompleted = this.checkDependenciesCompleted(step, plan);
        
        if (dependenciesCompleted) {
          executables.push(index);
        } else {
          // Cập nhật trạng thái chờ nếu đang PENDING
          if (step.status === StepStatus.PENDING) {
            step.status = StepStatus.WAITING;
          }
        }
      }
      return executables;
    }, [] as number[]);
  }
  
  /**
   * Kiểm tra xem tất cả các bước phụ thuộc đã hoàn thành chưa
   */
  private checkDependenciesCompleted(step: ActionStep, plan: ActionPlan): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }
    
    // Kiểm tra từng dependency
    return step.dependsOn.every(depId => {
      const depStep = plan.steps.find(s => s.id === depId);
      if (!depStep) {
        this.logger.warn(`Bước ${step.id} phụ thuộc vào bước không tồn tại: ${depId}`);
        return false;
      }
      return depStep.status === StepStatus.SUCCEEDED;
    });
  }
  
  /**
   * Thực thi một bước trong kế hoạch
   */
  private async executeStep(plan: ActionPlan, stepIndex: number): Promise<void> {
    const step = plan.steps[stepIndex];
    
    try {
      // Cập nhật trạng thái bắt đầu
      step.status = StepStatus.RUNNING;
      step.startTime = new Date();
      
      // Kiểm tra điều kiện thực thi nếu có
      if (step.condition && !this.evaluateCondition(step.condition, plan.executionContext)) {
        this.logger.log(`Bỏ qua bước ${step.id} do điều kiện không thỏa: ${step.condition}`);
        step.status = StepStatus.SKIPPED;
        step.endTime = new Date();
        return;
      }
      
      // Render prompt với context hiện tại
      const renderedPrompt = this.renderPromptTemplate(step.prompt, plan.executionContext);
      
      // Lấy agent tương ứng với loại agent của step
      const agent = this.agentFactory.getAgent(step.agentType);
      
      // Gọi agent thực hiện prompt
      const options = {
        timeout: step.timeout || 30000,
        metadata: {
          stepId: step.id,
          planIndex: plan.currentStepIndex
        }
      };
      
      this.logger.log(`Thực thi bước ${step.id} với agent ${step.agentType}: ${renderedPrompt}`);
      const result = await agent.executePrompt(renderedPrompt, options);
      
      // Lưu kết quả
      step.result = result;
      
      // Cập nhật trạng thái
      if (result.success) {
        step.status = StepStatus.SUCCEEDED;
        this.logger.log(`Bước ${step.id} thành công`);
      } else {
        // Xử lý retry
        if (step.retryCount < (step.maxRetries || 2)) {
          step.retryCount = (step.retryCount || 0) + 1;
          step.status = StepStatus.RETRYING;
          this.logger.warn(`Bước ${step.id} thất bại, thử lại lần ${step.retryCount}/${step.maxRetries}: ${result.error?.message}`);
        } else {
          step.status = StepStatus.FAILED;
          step.error = new Error(result.error?.message || 'Thực thi thất bại sau nhiều lần thử');
          this.logger.error(`Bước ${step.id} thất bại sau ${step.retryCount} lần thử: ${step.error.message}`);
        }
      }
      
      // Cập nhật executionContext với kết quả mới
      plan.executionContext = {
        ...plan.executionContext,
        result: {
          ...(plan.executionContext.result || {}),
          [step.id]: step.result
        }
      };
      
    } catch (error) {
      // Xử lý lỗi
      this.logger.error(`Lỗi khi thực thi bước ${step.id}: ${error.message}`);
      step.status = StepStatus.FAILED;
      step.error = error;
      
    } finally {
      step.endTime = new Date();
    }
  }
  
  /**
   * Đánh giá điều kiện để thực hiện bước
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Xử lý điều kiện tiếng Việt
      const processedCondition = this.processVietnameseCondition(condition);
      
      // Sử dụng Function constructor để đánh giá điều kiện trong context
      const evalFunction = new Function(...Object.keys(context), `return ${processedCondition};`);
      return evalFunction(...Object.values(context));
    } catch (error) {
      this.logger.error(`Lỗi khi đánh giá điều kiện '${condition}': ${error.message}`);
      return false;
    }
  }
  
  /**
   * Xử lý điều kiện tiếng Việt thành biểu thức JavaScript
   */
  private processVietnameseCondition(condition: string): string {
    // Nếu điều kiện rỗng hoặc undefined, trả về true
    if (!condition) return 'true';
    
    // Xử lý các từ khóa tiếng Việt thông dụng
    let processedCondition = condition
      .replace(/Nếu/gi, '')
      .replace(/có/gi, '')
      .replace(/không/gi, '!')
      .replace(/và/gi, '&&')
      .replace(/hoặc/gi, '||')
      .replace(/bằng/gi, '===')
      .replace(/khác/gi, '!==')
      .replace(/lớn hơn/gi, '>')
      .replace(/nhỏ hơn/gi, '<')
      .replace(/lớn hơn hoặc bằng/gi, '>=')
      .replace(/nhỏ hơn hoặc bằng/gi, '<=');
      
    // Xử lý trường hợp câu điều kiện đơn giản
    if (processedCondition.includes('task') || 
        processedCondition.includes('công việc') || 
        processedCondition.includes('nhiệm vụ')) {
      return 'true'; // Mặc định trả về true nếu liên quan đến task, công việc
    }
    
    // Kiểm tra xem có thể đánh giá biểu thức hay không
    try {
      // Thử compile biểu thức để xem có lỗi syntax không
      new Function(`return ${processedCondition};`);
      return processedCondition;
    } catch (error) {
      this.logger.warn(`Không thể xử lý điều kiện '${condition}', trả về true mặc định`);
      return 'true'; // Nếu không xử lý được, trả về true
    }
  }
  
  /**
   * Render prompt template với context
   */
  private renderPromptTemplate(template: string, context: Record<string, any>): string {
    try {
      return template.replace(/\{([^}]+)\}/g, (match, path) => {
        try {
          // Đánh giá biểu thức trong {}
          const evalFunction = new Function(...Object.keys(context), `return ${path};`);
          const result = evalFunction(...Object.values(context));
          return result !== undefined ? String(result) : match;
        } catch (e) {
          return match; // Giữ nguyên nếu không thể đánh giá
        }
      });
    } catch (error) {
      this.logger.error(`Lỗi khi render template: ${error.message}`);
      return template;
    }
  }
  
  /**
   * Tính toán tiến độ tổng thể của kế hoạch
   */
  private calculateProgress(plan: ActionPlan): number {
    const completedSteps = plan.steps.filter(s => 
      [StepStatus.SUCCEEDED, StepStatus.FAILED, StepStatus.SKIPPED].includes(s.status)
    ).length;
    
    return Math.round((completedSteps / plan.steps.length) * 100);
  }
  
  /**
   * Kiểm tra xem tất cả các bước đã hoàn thành thành công chưa
   */
  private allStepsCompleted(plan: ActionPlan): boolean {
    return plan.steps.every(s => 
      s.status === StepStatus.SUCCEEDED || s.status === StepStatus.SKIPPED
    );
  }
} 