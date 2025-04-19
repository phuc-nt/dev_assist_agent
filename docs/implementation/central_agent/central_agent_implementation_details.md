# Chi tiết triển khai Central Agent

Tài liệu này chứa chi tiết kỹ thuật để triển khai các thành phần core của Central Agent. Mục đích của tài liệu là cung cấp hướng dẫn cụ thể cho việc xây dựng từng module và cách chúng tương tác với nhau.

## 1. Input Processor

```typescript
// src/core/central-agent/input-processor/input-processor.ts
import { LLMService } from '../../../services/llm-service';
import { ConversationContext } from '../../models/conversation-context';

export class InputProcessor {
  constructor(private llmService: LLMService) {}

  async processInput(
    userInput: string, 
    context: ConversationContext
  ): Promise<string> {
    // Xây dựng prompt cho LLM
    const prompt = this.buildProcessingPrompt(userInput, context);
    
    // Gọi LLM để phân tích yêu cầu
    const response = await this.llmService.complete(prompt, {
      temperature: 0.2,
      max_tokens: 500
    });
    
    // Kết quả là một mô tả chi tiết bằng ngôn ngữ tự nhiên
    return response.text;
  }
  
  private buildProcessingPrompt(
    userInput: string, 
    context: ConversationContext
  ): string {
    return `
    Phân tích yêu cầu sau của người dùng: "${userInput}"
    
    Thông tin ngữ cảnh:
    - Người dùng: ${context.user.name}
    - Dự án: ${context.project?.name || 'Không xác định'}
    - Lịch sử hội thoại: ${context.conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}
    
    Mô tả chi tiết:
    1. Ý định của người dùng và các hành động cần thiết
    2. Các thông tin cần thiết như project, timeline, status, v.v.
    3. Bất kỳ ngữ cảnh bổ sung nào
    
    Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
    `;
  }
}
```

## 2. Action Planner

```typescript
// src/core/central-agent/action-planner/action-planner.ts
import { LLMService } from '../../../services/llm-service';
import { ActionPlan, ActionStep, AgentType } from '../../models/action-plan';

export class ActionPlanner {
  constructor(private llmService: LLMService) {}

  async createPlan(processedInput: string): Promise<ActionPlan> {
    // Xây dựng prompt cho LLM
    const prompt = this.buildPlanningPrompt(processedInput);
    
    // Gọi LLM để tạo kế hoạch
    const response = await this.llmService.complete(prompt, {
      temperature: 0.2,
      max_tokens: 1000
    });
    
    // Parse kết quả từ LLM
    const planSteps = this.parsePlanFromLLMResponse(response.text);
    
    // Tạo ActionPlan object
    return {
      steps: planSteps,
      currentStepIndex: 0,
      executionContext: {},
      status: 'CREATED',
      overallProgress: 0,
      startTime: new Date()
    };
  }
  
  private buildPlanningPrompt(processedInput: string): string {
    return `
    Dựa trên yêu cầu đã được phân tích sau:
    
    ${processedInput}
    
    Tạo kế hoạch thực hiện bao gồm các bước với thông tin:
    1. ID của bước
    2. Loại agent cần gọi (JIRA, SLACK, EMAIL, v.v.)
    3. Prompt ngôn ngữ tự nhiên chi tiết cho agent đó
    4. Các bước phụ thuộc (nếu có)
    5. Điều kiện thực hiện (nếu có)
    
    Các prompt cần chứa đủ thông tin để Sub-Agent có thể tự xác định hành động cụ thể.
    Trả về kế hoạch theo định dạng JSON.
    `;
  }
  
  private parsePlanFromLLMResponse(llmResponse: string): ActionStep[] {
    // Parse JSON từ response
    try {
      // Tìm và trích xuất phần JSON từ phản hồi
      const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       llmResponse.match(/{[\s\S]*}/);
      
      if (!jsonMatch) {
        throw new Error('Không tìm thấy JSON trong phản hồi');
      }
      
      const planJson = JSON.parse(jsonMatch[0]);
      
      // Chuyển đổi sang ActionStep[]
      return planJson.steps.map((step: any) => ({
        id: step.id,
        agentType: step.agentType as AgentType,
        prompt: step.prompt,
        dependsOn: step.dependsOn || [],
        condition: step.condition,
        maxRetries: step.maxRetries || 3,
        retryCount: 0,
        timeout: step.timeout || 30000,
        status: 'PENDING'
      }));
    } catch (error) {
      console.error('Lỗi khi parse kế hoạch:', error);
      throw new Error('Không thể tạo kế hoạch từ LLM response');
    }
  }
}
```

## 3. Agent Coordinator

```typescript
// src/core/central-agent/coordinator/agent-coordinator.ts
import { ActionPlan, ActionStep, StepStatus } from '../../models/action-plan';
import { AgentFactory } from '../../../agents/agent-factory';
import { StorageService } from '../../../services/storage-service';

export class AgentCoordinator {
  constructor(
    private agentFactory: AgentFactory,
    private storageService: StorageService
  ) {}

  async executeActionPlan(plan: ActionPlan): Promise<ActionPlan> {
    // Cập nhật trạng thái plan
    plan.status = 'RUNNING';
    await this.storageService.updateActionPlan(plan);
    
    // Thực thi từng step
    while (plan.currentStepIndex < plan.steps.length && plan.status === 'RUNNING') {
      // Tìm các step sẵn sàng thực thi (tất cả các dependency đã hoàn thành)
      const readySteps = this.findReadySteps(plan);
      
      if (readySteps.length === 0) {
        // Không có step nào sẵn sàng nhưng chưa hoàn thành
        if (this.allStepsCompleted(plan)) {
          plan.status = 'COMPLETED';
          plan.endTime = new Date();
        } else {
          // Có thể có deadlock hoặc lỗi dependency
          plan.status = 'FAILED';
          plan.error = new Error('Không thể tiếp tục thực thi (deadlock hoặc lỗi dependency)');
        }
        break;
      }
      
      // Thực thi song song các step sẵn sàng
      await Promise.all(readySteps.map(step => this.executeStep(step, plan)));
      
      // Cập nhật tiến độ
      this.updatePlanProgress(plan);
      await this.storageService.updateActionPlan(plan);
    }
    
    return plan;
  }
  
  private findReadySteps(plan: ActionPlan): ActionStep[] {
    return plan.steps.filter(step => {
      // Kiểm tra trạng thái
      if (step.status !== 'PENDING' && step.status !== 'WAITING') {
        return false;
      }
      
      // Kiểm tra dependencies
      const allDependenciesCompleted = step.dependsOn.every(depId => {
        const depStep = plan.steps.find(s => s.id === depId);
        return depStep && ['SUCCEEDED', 'SKIPPED'].includes(depStep.status);
      });
      
      if (!allDependenciesCompleted) {
        step.status = 'WAITING';
        return false;
      }
      
      // Kiểm tra điều kiện
      if (step.condition) {
        try {
          const conditionResult = this.evaluateCondition(step.condition, plan.executionContext);
          if (!conditionResult) {
            step.status = 'SKIPPED';
            return false;
          }
        } catch (error) {
          console.error(`Lỗi khi đánh giá điều kiện cho step ${step.id}:`, error);
          step.status = 'FAILED';
          step.error = error as Error;
          return false;
        }
      }
      
      return true;
    });
  }
  
  private async executeStep(step: ActionStep, plan: ActionPlan): Promise<void> {
    try {
      // Cập nhật trạng thái
      step.status = 'RUNNING';
      step.startTime = new Date();
      
      // Render prompt với context
      const renderedPrompt = this.renderPromptTemplate(step.prompt, plan.executionContext);
      
      // Lấy agent phù hợp
      const agent = this.agentFactory.getAgent(step.agentType);
      
      // Thực thi step với agent
      const result = await agent.executePrompt(renderedPrompt, {
        timeout: step.timeout
      });
      
      // Xử lý kết quả
      step.result = result;
      step.status = result.success ? 'SUCCEEDED' : 'FAILED';
      step.endTime = new Date();
      
      // Nếu thất bại và có thể retry
      if (!result.success && step.retryCount < step.maxRetries) {
        step.retryCount++;
        step.status = 'RETRYING';
        
        // Thực thi lại với điều chỉnh prompt nếu cần
        const retryPrompt = this.generateRetryPrompt(renderedPrompt, result.error);
        const retryResult = await agent.executePrompt(retryPrompt, {
          timeout: step.timeout
        });
        
        step.result = retryResult;
        step.status = retryResult.success ? 'SUCCEEDED' : 'FAILED';
        step.endTime = new Date();
      }
      
      // Cập nhật executionContext
      plan.executionContext.result = {
        ...plan.executionContext.result,
        [step.id]: step.result
      };
      
    } catch (error) {
      console.error(`Lỗi khi thực thi step ${step.id}:`, error);
      step.status = 'FAILED';
      step.error = error as Error;
      step.endTime = new Date();
    }
  }
  
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Đơn giản hóa: sử dụng eval() (trong thực tế nên dùng giải pháp an toàn hơn)
    // Ví dụ: json-logic, expression-eval, v.v.
    try {
      // Tạo một function với context
      const evaluateWithContext = new Function(
        ...Object.keys(context),
        `return ${condition};`
      );
      
      // Thực thi với các biến từ context
      return evaluateWithContext(...Object.values(context));
    } catch (error) {
      console.error('Lỗi khi đánh giá điều kiện:', error);
      throw new Error(`Không thể đánh giá điều kiện: ${condition}`);
    }
  }
  
  private renderPromptTemplate(template: string, context: Record<string, any>): string {
    // Sử dụng regex để tìm và thay thế các biến từ context
    // Ví dụ: {result.step1.issues.map(i => i.key).join(', ')}
    
    return template.replace(/{([^}]+)}/g, (match, expression) => {
      try {
        // Tương tự như evaluateCondition, sử dụng Function constructor
        const evaluateExpression = new Function(
          ...Object.keys(context),
          `try { return ${expression}; } catch (e) { return '${match}'; }`
        );
        
        const result = evaluateExpression(...Object.values(context));
        return result !== undefined ? result : match;
      } catch (error) {
        console.error(`Lỗi khi render biểu thức ${expression}:`, error);
        return match; // Giữ nguyên nếu có lỗi
      }
    });
  }
  
  private generateRetryPrompt(originalPrompt: string, error: any): string {
    // Thêm thông tin về lỗi vào prompt để hướng dẫn retry
    return `${originalPrompt}\n\nLưu ý: Lần thực hiện trước gặp lỗi: "${error?.message || JSON.stringify(error)}". Hãy điều chỉnh cách thực hiện phù hợp.`;
  }
  
  private allStepsCompleted(plan: ActionPlan): boolean {
    return plan.steps.every(step => 
      ['SUCCEEDED', 'FAILED', 'SKIPPED'].includes(step.status)
    );
  }
  
  private updatePlanProgress(plan: ActionPlan): void {
    const completedSteps = plan.steps.filter(
      s => ['SUCCEEDED', 'SKIPPED', 'FAILED'].includes(s.status)
    ).length;
    
    plan.overallProgress = Math.round((completedSteps / plan.steps.length) * 100);
  }
}
```

## 4. Result Synthesizer

```typescript
// src/core/central-agent/synthesizer/result-synthesizer.ts
import { LLMService } from '../../../services/llm-service';
import { ActionPlan } from '../../models/action-plan';

export class ResultSynthesizer {
  constructor(private llmService: LLMService) {}

  async synthesizeResult(plan: ActionPlan): Promise<string> {
    // Xây dựng prompt cho LLM
    const prompt = this.buildSynthesizingPrompt(plan);
    
    // Gọi LLM để tổng hợp kết quả
    const response = await this.llmService.complete(prompt, {
      temperature: 0.3,
      max_tokens: 500
    });
    
    return response.text;
  }
  
  private buildSynthesizingPrompt(plan: ActionPlan): string {
    // Tạo tóm tắt các bước đã thực hiện và kết quả
    const stepSummaries = plan.steps.map(step => {
      if (step.status === 'SKIPPED') {
        return `- ${step.id} (${step.agentType}): Đã bỏ qua (điều kiện không thỏa)`;
      }
      
      if (step.status === 'FAILED') {
        return `- ${step.id} (${step.agentType}): Thất bại - Lỗi: ${step.error?.message || 'Không xác định'}`;
      }
      
      if (step.status === 'SUCCEEDED') {
        return `- ${step.id} (${step.agentType}): Thành công - Kết quả: ${JSON.stringify(step.result?.data || {})}`;
      }
      
      return `- ${step.id} (${step.agentType}): Trạng thái ${step.status}`;
    }).join('\n');
    
    return `
    Tổng hợp kết quả thực hiện kế hoạch với các bước sau:
    
    ${stepSummaries}
    
    Trạng thái tổng thể: ${plan.status}
    Tiến độ: ${plan.overallProgress}%
    
    Dựa trên các kết quả trên, hãy tạo một tóm tắt ngắn gọn rõ ràng của toàn bộ quá trình thực thi để trả lời cho người dùng.
    Tập trung vào các kết quả đạt được, thông tin quan trọng và các lỗi nếu có.
    Sử dụng ngôn ngữ tự nhiên, thân thiện và ngắn gọn.
    `;
  }
}
```

## 5. Các model và interface cần thiết

```typescript
// src/core/models/action-plan.ts
export interface ActionPlan {
  steps: ActionStep[];
  currentStepIndex: number;
  executionContext: Record<string, any>;
  status: PlanStatus;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  overallProgress: number;
}

export interface ActionStep {
  id: string;
  agentType: AgentType;
  prompt: string;
  dependsOn: string[];
  condition?: string;
  maxRetries?: number;
  retryCount?: number;
  timeout?: number;
  status: StepStatus;
  result?: StepResult;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: any;
  metadata?: {
    executionTime?: number;
    tokenUsage?: number;
  };
}

export enum StepStatus {
  PENDING = 'pending',     // Chưa bắt đầu
  WAITING = 'waiting',     // Đang chờ các step phụ thuộc
  RUNNING = 'running',     // Đang thực thi
  SUCCEEDED = 'succeeded', // Thành công
  FAILED = 'failed',       // Thất bại
  RETRYING = 'retrying',   // Đang thử lại
  SKIPPED = 'skipped',     // Bỏ qua (do điều kiện không thỏa)
  CANCELLED = 'cancelled'  // Đã hủy
}

export enum PlanStatus {
  CREATED = 'created',     // Mới tạo
  RUNNING = 'running',     // Đang thực thi
  COMPLETED = 'completed', // Hoàn thành thành công
  FAILED = 'failed',       // Thất bại
  CANCELLED = 'cancelled'  // Đã hủy
}

export enum AgentType {
  JIRA = 'JIRA',
  SLACK = 'SLACK',
  EMAIL = 'EMAIL',
  GIT = 'GIT',
  CONFLUENCE = 'CONFLUENCE'
}
```

```typescript
// src/core/models/conversation-context.ts
export interface ConversationContext {
  user: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    key: string;
  };
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  // Các thông tin bổ sung
  metaData?: Record<string, any>;
}
```

## 6. Tích hợp các thành phần

```typescript
// src/core/central-agent/central-agent.ts
import { InputProcessor } from './input-processor/input-processor';
import { ActionPlanner } from './action-planner/action-planner';
import { AgentCoordinator } from './coordinator/agent-coordinator';
import { ResultSynthesizer } from './synthesizer/result-synthesizer';
import { ConversationContext } from '../models/conversation-context';
import { ProjectConfigReader } from '../project-config/project-config-reader';

export class CentralAgent {
  constructor(
    private inputProcessor: InputProcessor,
    private actionPlanner: ActionPlanner,
    private agentCoordinator: AgentCoordinator,
    private resultSynthesizer: ResultSynthesizer,
    private projectConfigReader: ProjectConfigReader
  ) {}

  async processRequest(
    userInput: string,
    userId: string,
    conversationHistory: any[]
  ): Promise<string> {
    try {
      // 1. Lấy thông tin dự án và người dùng
      const projectContext = await this.projectConfigReader.getProjectContext(userId);
      
      // 2. Xây dựng ngữ cảnh hội thoại
      const context: ConversationContext = {
        user: projectContext.user,
        project: projectContext.project,
        conversationHistory: this.formatConversationHistory(conversationHistory)
      };
      
      // 3. Xử lý đầu vào và phân tích ý định
      const processedInput = await this.inputProcessor.processInput(userInput, context);
      
      // 4. Tạo kế hoạch hành động
      const plan = await this.actionPlanner.createPlan(processedInput);
      
      // 5. Thực thi kế hoạch
      const executedPlan = await this.agentCoordinator.executeActionPlan(plan);
      
      // 6. Tổng hợp kết quả
      const result = await this.resultSynthesizer.synthesizeResult(executedPlan);
      
      return result;
    } catch (error) {
      console.error('Lỗi khi xử lý yêu cầu:', error);
      return `Xin lỗi, tôi không thể xử lý yêu cầu của bạn. Lỗi: ${error.message}`;
    }
  }
  
  private formatConversationHistory(history: any[]): ConversationContext['conversationHistory'] {
    return history.map(item => ({
      role: item.role,
      content: item.content,
      timestamp: new Date(item.timestamp)
    }));
  }
}
```

## 7. Agent Interface và Factory

```typescript
// src/agents/agent-interface.ts
export interface SubAgent {
  executePrompt(
    prompt: string, 
    options?: { timeout?: number }
  ): Promise<{
    success: boolean;
    data?: any;
    error?: any;
    metadata?: {
      executionTime?: number;
      tokenUsage?: number;
    };
  }>;
}
```

```typescript
// src/agents/agent-factory.ts
import { AgentType } from '../core/models/action-plan';
import { SubAgent } from './agent-interface';
import { JiraAgent } from './jira/jira-agent';
import { SlackAgent } from './slack/slack-agent';

export class AgentFactory {
  private agents: Map<AgentType, SubAgent> = new Map();
  
  constructor() {
    // Khởi tạo các agent
    this.agents.set(AgentType.JIRA, new JiraAgent());
    this.agents.set(AgentType.SLACK, new SlackAgent());
    // Thêm các agent khác khi cần
  }
  
  getAgent(type: AgentType): SubAgent {
    const agent = this.agents.get(type);
    
    if (!agent) {
      throw new Error(`Agent không được hỗ trợ: ${type}`);
    }
    
    return agent;
  }
  
  registerAgent(type: AgentType, agent: SubAgent): void {
    this.agents.set(type, agent);
  }
}
```

## 8. Ví dụ LLM Service

```typescript
// src/services/llm-service.ts
import { Configuration, OpenAIApi } from 'openai';

export class LLMService {
  private openai: OpenAIApi;
  
  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey: apiKey
    });
    
    this.openai = new OpenAIApi(configuration);
  }
  
  async complete(
    prompt: string, 
    options: { temperature?: number; max_tokens?: number }
  ): Promise<{ text: string; usage?: { total_tokens: number } }> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'Bạn là DevAssist Bot, một trợ lý thông minh cho công việc phát triển phần mềm.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.max_tokens || 500
      });
      
      return {
        text: response.data.choices[0].message?.content || '',
        usage: response.data.usage
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      throw new Error(`Lỗi khi gọi OpenAI API: ${error.message}`);
    }
  }
}
```

## 9. Xử lý lỗi và logging

```typescript
// src/core/utils/error-handler.ts
import { Logger } from './logger';

export class ErrorHandler {
  constructor(private logger: Logger) {}
  
  handleError(error: Error, context?: any): void {
    this.logger.error(`Error: ${error.message}`, {
      stack: error.stack,
      context
    });
    
    // Có thể thêm các xử lý như gửi thông báo, lưu lỗi vào DB, v.v.
  }
  
  async withErrorHandling<T>(
    fn: () => Promise<T>, 
    context?: any, 
    defaultValue?: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error, context);
      
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      throw error;
    }
  }
}
```

```typescript
// src/core/utils/logger.ts
export class Logger {
  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data || '');
  }
  
  error(message: string, data?: any): void {
    console.error(`[ERROR] ${message}`, data || '');
  }
  
  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
  }
  
  debug(message: string, data?: any): void {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
  
  trace(message: string, data?: any): void {
    console.trace(`[TRACE] ${message}`, data || '');
  }
}
```

## 10. Lưu trữ kế hoạch và kết quả

```typescript
// src/services/storage-service.ts
import { ActionPlan } from '../core/models/action-plan';
import { MongoClient, Db, Collection } from 'mongodb';

export class StorageService {
  private db: Db;
  private planCollection: Collection;
  
  constructor(mongoUri: string) {
    this.connect(mongoUri);
  }
  
  private async connect(mongoUri: string): Promise<void> {
    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      
      this.db = client.db('devassist');
      this.planCollection = this.db.collection('action_plans');
      
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  
  async saveActionPlan(plan: ActionPlan): Promise<string> {
    const result = await this.planCollection.insertOne(plan);
    return result.insertedId.toString();
  }
  
  async updateActionPlan(plan: ActionPlan): Promise<void> {
    await this.planCollection.updateOne(
      { _id: plan._id },
      { $set: plan }
    );
  }
  
  async getActionPlan(planId: string): Promise<ActionPlan | null> {
    return await this.planCollection.findOne({ _id: planId });
  }
  
  async getRecentPlans(userId: string, limit = 10): Promise<ActionPlan[]> {
    return await this.planCollection
      .find({ 'user.id': userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray();
  }
}
```

## 11. Lưu ý triển khai

### 11.1 Xử lý lỗi toàn diện

- Đảm bảo mỗi module đều triển khai xử lý lỗi kỹ lưỡng
- Sử dụng try-catch cho các hàm async 
- Lưu log đầy đủ với thông tin context
- Có cơ chế recovery khi có lỗi từ các service bên ngoài

### 11.2 Tối ưu hiệu suất

- Cache kết quả LLM cho các yêu cầu tương tự
- Sử dụng connection pool cho MongoDB
- Tối ưu các truy vấn database
- Sử dụng Promise.all cho các tác vụ có thể chạy song song

### 11.3 Tương thích với các Sub-Agent

- Đảm bảo kết quả trả về từ các Sub-Agent có cấu trúc thống nhất
- Xử lý các trường hợp timeout từ Sub-Agent
- Triển khai mock Sub-Agents trong quá trình phát triển
- Tài liệu hóa API của Sub-Agent interface

### 11.4 Testing

- Unit test cho mỗi thành phần riêng biệt
- Integration test cho các luồng end-to-end
- Mock các dependency external
- Kiểm thử các trường hợp lỗi và xử lý biên 