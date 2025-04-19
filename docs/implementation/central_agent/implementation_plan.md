# Kế hoạch triển khai Central Agent

## Tổng quan
Kế hoạch triển khai Central Agent theo mô hình đã thiết kế, tập trung vào việc xây dựng từng module riêng biệt và tích hợp chúng với nhau. Trong giai đoạn đầu, các sub-agent sẽ được mock để tập trung vào việc xây dựng hoàn chỉnh Central Agent.

## Danh sách tác vụ và tiến độ

### Phase 1: Thiết lập cơ bản
- [x] Tạo cấu trúc thư mục cho Central Agent
- [x] Thiết lập các interface cơ bản
- [x] Tạo API endpoint chính cho central agent
- [x] Thêm unit test cơ bản

### Phase 2: Input Processor
- [x] Thiết kế interface và class cho Input Processor
- [x] Tích hợp OpenAI API cho việc phân tích yêu cầu
- [x] Xây dựng prompt template cho Input Processor
- [x] Tạo mock data cho các trường hợp test
- [x] Viết unit test cho Input Processor
- [x] Kiểm thử API endpoint với Input Processor

### Phase 3: Project Config Reader
- [x] Xây dựng class ProjectConfigReader
- [x] Tích hợp đọc file cấu hình dự án
- [x] Viết unit test cho ProjectConfigReader

### Phase 4: Action Planner
- [x] Thiết kế interface và class cho Action Planner
- [x] Xây dựng cấu trúc ActionPlan và ActionStep
- [x] Tích hợp OpenAI API cho việc lập kế hoạch
- [x] Xây dựng prompt template cho Action Planner
- [x] Viết unit test cho Action Planner

### Phase 5: Agent Coordinator
- [x] Thiết kế interface và class cho Agent Coordinator
- [x] Xây dựng logic xử lý các bước trong kế hoạch
- [x] Phát triển cơ chế tương tác với các sub-agent (mock)
- [x] Viết unit test cho Agent Coordinator

### Phase 6: Result Synthesizer
- [x] Thiết kế interface và class cho Result Synthesizer
- [x] Tích hợp OpenAI API cho việc tổng hợp kết quả
- [x] Xây dựng prompt template cho Result Synthesizer
- [x] Viết unit test cho Result Synthesizer

### Phase 7: Mock Sub-Agents
- [x] Tạo mock JIRA Agent
- [x] Tạo mock Slack Agent
- [x] Tạo Agent Factory để quản lý các agent

### Phase 8: Tích hợp hoàn chỉnh
- [x] Tích hợp tất cả các module
- [x] Tạo e2e test cho toàn bộ luồng xử lý
- [ ] Viết API documentation
- [x] Kiểm thử với các kịch bản sử dụng thực tế

### Phase 9: Cấu hình tập trung LLM
- [x] Tạo file cấu hình tập trung cho LLM và prompt
- [x] Triển khai các API endpoints để quản lý cấu hình
- [x] Cập nhật các thành phần để sử dụng cấu hình tập trung
- [x] Cải thiện hệ thống logging để theo dõi việc sử dụng LLM

### Phase 10: Theo dõi chi phí (Cost Monitoring)
- [ ] Tạo module theo dõi chi phí sử dụng LLM
- [ ] Thiết kế cấu trúc dữ liệu cho việc lưu trữ thông tin sử dụng token
- [ ] Cập nhật `OpenaiService` để theo dõi và tính toán chi phí
- [ ] Tạo API endpoints để xem thống kê chi phí
- [ ] Triển khai cơ chế cảnh báo khi chi phí vượt ngưỡng

## Báo cáo tiến độ

### Phiên làm việc #1: Hoàn thành Phase 1-3
- Đã tạo cấu trúc thư mục và thiết lập các file cơ bản cho Central Agent
- Đã triển khai ProjectConfigReader để đọc thông tin cấu hình từ file JSON
- Đã triển khai InputProcessor để phân tích yêu cầu người dùng sử dụng OpenAI API
- Đã tạo API endpoint `/central-agent/process` để nhận và xử lý yêu cầu người dùng
- Đã viết unit test cho các thành phần đã triển khai
- API endpoint đã hoạt động và trả về kết quả phân tích yêu cầu

### Phiên làm việc #2: Hoàn thành Phase 4
- Đã tạo cấu trúc model cho ActionPlan và ActionStep
- Đã triển khai ActionPlanner để tạo kế hoạch hành động từ phân tích yêu cầu
- Đã tích hợp với OpenAI API để lập kế hoạch
- Đã viết unit test cho ActionPlanner
- Đã tích hợp ActionPlanner vào CentralAgentService
- API endpoint hiện trả về phân tích yêu cầu và kế hoạch hành động

### Phiên làm việc #3: Cải thiện hệ thống logging
- Đã triển khai EnhancedLogger để cải thiện khả năng ghi log trong toàn bộ hệ thống
- Đã tích hợp EnhancedLogger vào ActionPlanner, InputProcessor, CentralAgentService và ActionPlanStorageService
- EnhancedLogger hỗ trợ ghi logs ra file với timestamp, phân loại mức log và hiển thị màu sắc trên terminal
- Logs được lưu tại thư mục `logs` với định dạng `app-YYYY-MM-DD.log`
- Cải thiện khả năng debug và theo dõi luồng xử lý của hệ thống

### Phiên làm việc #4: Hoàn thành Phase 5 và 7
- Đã triển khai AgentCoordinator để thực thi kế hoạch hành động
- Đã phát triển cơ chế xử lý điều kiện phụ thuộc giữa các bước
- Đã tạo MockJiraAgent và MockSlackAgent để mô phỏng tương tác với các hệ thống bên ngoài
- Đã triển khai AgentFactory để quản lý các agent theo loại
- Đã thiết lập cấu trúc dữ liệu cho kết quả thực thi từ các agent
- Đã viết unit test và integration test cho AgentCoordinator
- Đã cải thiện cơ chế xử lý lỗi và retry cho các bước thực thi

### Phiên làm việc #5: Cải tiến và sửa lỗi
- Đã cải thiện cơ chế xử lý điều kiện tiếng Việt trong AgentCoordinator
- Đã mở rộng mock data cho MockSlackAgent để hiển thị thông báo phong phú hơn
- Đã cải thiện cơ chế lưu trữ và cập nhật kế hoạch trong database và file
- Đã sửa lỗi databaseId không được lưu khi cập nhật kết quả thực thi
- Đã thực hiện kiểm thử e2e với nhiều kịch bản sử dụng thực tế
- Đã cải thiện hiệu suất và độ tin cậy của toàn bộ hệ thống

### Phiên làm việc #6: Hoàn thành Phase 6
- Đã triển khai ResultSynthesizerService để tổng hợp kết quả từ các bước thực thi
- Đã tích hợp với OpenAI API thông qua phương thức chatWithFunctionCalling
- Đã cập nhật CentralAgentService để sử dụng ResultSynthesizerService
- Đã viết unit test cho ResultSynthesizerService
- Phản hồi người dùng giờ đây đã chi tiết hơn và tự nhiên hơn
- Với các thành phần đã triển khai, Central Agent đã có thể thực hiện đầy đủ vòng lặp: Input → Plan → Execute → Result

### Phiên làm việc #7: Hoàn thành Phase 9
- Đã tạo file `src/config/llm.config.ts` để tập trung quản lý các cấu hình LLM và prompt
- Đã triển khai cấu trúc dữ liệu `LLMConfig` và `PromptConfig` để quản lý các cấu hình
- Đã cập nhật `OpenaiService` để sử dụng cấu hình tập trung
- Đã triển khai các API endpoints để xem và cập nhật cấu hình LLM:
  - GET `/openai/config` - Lấy cấu hình LLM hiện tại
  - POST `/openai/config` - Cập nhật cấu hình LLM
  - GET `/openai/model` - Lấy thông tin model hiện tại
  - POST `/openai/test-model` - Test model với prompt
- Đã thêm biến môi trường `OPENAI_MODEL` để cấu hình model mặc định từ môi trường
- Đã cập nhật tất cả các thành phần (InputProcessor, ActionPlanner, ResultSynthesizer) để sử dụng cấu hình tập trung
- Đã cải thiện hệ thống logging để theo dõi việc sử dụng LLM trong các thành phần
- Đã viết thêm chi tiết hướng dẫn sử dụng cấu hình tập trung trong code

## Bài học kinh nghiệm
1. **Cấu hình cổng kết nối**: Fix cứng cổng trong main.ts để tránh xung đột với các tiến trình khác
2. **SQLite cho môi trường phát triển**: Cần đảm bảo gói `sqlite3` đã được cài đặt khi sử dụng TypeORM với SQLite
3. **OpenAI API key**: Đảm bảo API key được cấu hình đúng trong file .env
4. **Thực hiện lệnh từ thư mục đúng**: Cần phải cd vào thư mục dev_assist_backend trước khi chạy npm run start:dev
5. **Cấu hình đường dẫn file**: Cần đảm bảo đường dẫn file cấu hình dự án được xác định đúng trong môi trường
6. **Xử lý lỗi kết nối cơ sở dữ liệu**: Kiểm tra SQLite đã được cài đặt đúng cách và có quyền truy cập vào thư mục lưu trữ cơ sở dữ liệu
7. **Quản lý databaseId**: Đảm bảo truyền databaseId khi cập nhật kết quả thực thi để tránh tạo nhiều kế hoạch mới
8. **Xử lý điều kiện tiếng Việt**: Cần xử lý đặc biệt đối với các điều kiện bằng tiếng Việt trong phương thức evaluateCondition

## Chi tiết triển khai đã hoàn thành

### Result Synthesizer
Result Synthesizer đã được triển khai thành công với các tính năng:

- Tổng hợp kết quả từ các bước thực thi thành câu trả lời mạch lạc, dễ hiểu
- Tích hợp với OpenAI API thông qua chatWithFunctionCalling
- Xử lý nhiều trường hợp khác nhau: thành công, thất bại, thực thi một phần
- Cung cấp thông tin chi tiết và có tính context về quá trình thực thi
- Ngữ cảnh tự nhiên và thân thiện với người dùng

File structure triển khai:
```
src/central-agent/
├── result-synthesizer/
│   ├── result-synthesizer.service.ts
│   └── result-synthesizer.spec.ts
```

### Cấu hình tập trung LLM
Hệ thống cấu hình tập trung LLM đã được triển khai với các tính năng:

- Cấu hình model và temperature được tập trung trong một file duy nhất
- Cấu hình prompt cho từng thành phần (InputProcessor, ActionPlanner, ResultSynthesizer, v.v.)
- API endpoints để quản lý cấu hình động
- Logging chi tiết về việc sử dụng model và token
- Override cấu hình từ biến môi trường

File structure triển khai:
```
src/
├── config/
│   └── llm.config.ts
├── openai/
│   ├── openai.service.ts
│   └── openai.controller.ts
```

## Kế hoạch tiếp theo

### 1. Hoàn thiện API Documentation
- Tạo Swagger document đầy đủ cho tất cả API endpoints
- Thêm mô tả chi tiết cho các DTO và entities
- Tạo hướng dẫn sử dụng API cho các nhà phát triển tiếp theo
- Mô tả các luồng làm việc chính và cách tích hợp

### 2. Cải thiện hiệu suất và reliability
- Tối ưu hóa prompt để giảm chi phí token
- Cải thiện cơ chế retry và xử lý lỗi
- Thêm logging chi tiết hơn để dễ debug
- Tạo các kịch bản test tự động

### 3. Triển khai Sub-Agents thực
Sau khi đã hoàn thiện Central Agent với mock Sub-Agents, bước tiếp theo sẽ là triển khai các Sub-Agents thực tế:

1. JIRA Agent: Tích hợp với JIRA API thực tế
2. Slack Agent: Tích hợp với Slack API thực tế
3. Thay thế các mock agents bằng các agents thực trong hệ thống

**Dự kiến triển khai JIRA Agent:**
```typescript
@Injectable()
export class JiraAgent {
  private readonly logger = EnhancedLogger.getLogger(JiraAgent.name);
  private readonly jiraApiService: JiraApiService;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenaiService,
  ) {
    this.jiraApiService = new JiraApiService(
      configService.get('JIRA_DOMAIN'),
      configService.get('JIRA_EMAIL'),
      configService.get('JIRA_API_TOKEN'),
    );
  }
  
  async execute(prompt: string): Promise<AgentResponse> {
    try {
      this.logger.log(`JIRA Agent executing: ${prompt}`);
      const startTime = Date.now();
      
      // Sử dụng OpenAI để phân tích prompt và xác định hành động JIRA cần thực hiện
      const analysis = await this.openaiService.chatWithFunctionCalling(
        this.getSystemPrompt(),
        prompt
      );
      
      // Thực hiện hành động JIRA thông qua JiraApiService
      // ... code thực thi các hành động JIRA ...
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          // Kết quả từ JIRA API
        },
        metadata: {
          executionTime,
          tokenUsage: 150 // estimation
        }
      };
    } catch (error) {
      this.logger.error(`Error executing JIRA Agent: ${error.message}`);
      return {
        success: false,
        error: {
          message: error.message
        },
        metadata: {}
      };
    }
  }
  
  private getSystemPrompt(): string {
    // System prompt cho JIRA agent
  }
}
```

### 4. Triển khai Cost Monitoring
Việc triển khai Cost Monitoring sẽ tập trung vào các khía cạnh sau:

#### 4.1 Token Usage Tracking
- Theo dõi số lượng token đầu vào và đầu ra cho mỗi lần gọi API
- Lưu trữ thông tin về model được sử dụng, prompt, kích thước phản hồi
- Tính toán chi phí dựa trên giá tiền cho mỗi model theo bảng giá của OpenAI

#### 4.2 Cấu trúc dữ liệu
```typescript
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface ModelCostConfig {
  model: string;
  promptTokenCost: number;  // USD per 1K tokens
  completionTokenCost: number;  // USD per 1K tokens
}

interface LLMUsageRecord {
  id: string;
  timestamp: Date;
  model: string;
  component: string;  // InputProcessor, ActionPlanner, etc.
  operation: string;  // chat, chatWithSystem, chatWithFunctionCalling
  tokenUsage: TokenUsage;
  cost: number;  // USD
  metadata?: Record<string, any>;
}
```

#### 4.3 Bảng chi phí dự kiến
```typescript
const MODEL_COST_CONFIG: Record<string, ModelCostConfig> = {
  'gpt-4o': {
    promptTokenCost: 0.01,  // $0.01 per 1K tokens
    completionTokenCost: 0.03  // $0.03 per 1K tokens
  },
  'gpt-4-turbo': {
    promptTokenCost: 0.01,
    completionTokenCost: 0.03
  },
  'gpt-4.1-mini': {
    promptTokenCost: 0.0025, 
    completionTokenCost: 0.0075
  },
  'gpt-3.5-turbo': {
    promptTokenCost: 0.0005,
    completionTokenCost: 0.0015
  }
};
```

#### 4.4 Cập nhật OpenaiService
OpenaiService sẽ được cập nhật để tính toán và lưu trữ thông tin sử dụng token:

```typescript
@Injectable()
export class OpenaiService {
  // ... existing code ...
  
  private readonly modelCostConfig: Record<string, ModelCostConfig>;
  private readonly tokenUsageRepository: Repository<LLMUsageRecord>;
  
  async chat(prompt: string, component: string = 'unknown') {
    try {
      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: this.llmConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.maxTokens,
      });
      
      const executionTime = Date.now() - startTime;
      
      // Lưu thông tin sử dụng token
      await this.trackTokenUsage({
        model: this.llmConfig.model,
        component,
        operation: 'chat',
        tokenUsage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        executionTime
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // ... error handling ...
    }
  }
  
  private async trackTokenUsage(data: {
    model: string;
    component: string;
    operation: string;
    tokenUsage: TokenUsage;
    executionTime: number;
    metadata?: Record<string, any>;
  }) {
    const { model, component, operation, tokenUsage, executionTime, metadata } = data;
    
    // Tính chi phí dựa trên model và usage
    const costConfig = this.modelCostConfig[model] || this.modelCostConfig['gpt-3.5-turbo'];
    
    const promptCost = (tokenUsage.promptTokens / 1000) * costConfig.promptTokenCost;
    const completionCost = (tokenUsage.completionTokens / 1000) * costConfig.completionTokenCost;
    const totalCost = promptCost + completionCost;
    
    // Lưu vào database
    const usageRecord = this.tokenUsageRepository.create({
      timestamp: new Date(),
      model,
      component,
      operation,
      tokenUsage,
      cost: totalCost,
      metadata: {
        ...metadata,
        executionTime
      }
    });
    
    await this.tokenUsageRepository.save(usageRecord);
    
    this.logger.log(
      `LLM Usage - Model: ${model}, Component: ${component}, Operation: ${operation}, ` +
      `Tokens: ${tokenUsage.totalTokens}, Cost: $${totalCost.toFixed(6)}`
    );
    
    return usageRecord;
  }
  
  // API endpoints để truy vấn chi phí
  async getDailyCost(date: Date = new Date()): Promise<{ cost: number; usage: TokenUsage }> {
    // Truy vấn chi phí theo ngày
  }
  
  async getMonthlyCost(year: number, month: number): Promise<{ cost: number; usage: TokenUsage }> {
    // Truy vấn chi phí theo tháng
  }
  
  async getUsageByComponent(): Promise<Record<string, { cost: number; usage: TokenUsage }>> {
    // Truy vấn chi phí theo component
  }
  
  async getUsageByModel(): Promise<Record<string, { cost: number; usage: TokenUsage }>> {
    // Truy vấn chi phí theo model
  }
}
```

#### 4.5 REST API Endpoints
```typescript
@Controller('cost-monitoring')
export class CostMonitoringController {
  constructor(private readonly costMonitoringService: CostMonitoringService) {}
  
  @Get('daily')
  getDailyCost(@Query('date') dateStr: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.costMonitoringService.getDailyCost(date);
  }
  
  @Get('monthly')
  getMonthlyCost(
    @Query('year') yearStr: string,
    @Query('month') monthStr: string
  ) {
    const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
    const month = monthStr ? parseInt(monthStr) : new Date().getMonth() + 1;
    return this.costMonitoringService.getMonthlyCost(year, month);
  }
  
  @Get('by-component')
  getUsageByComponent() {
    return this.costMonitoringService.getUsageByComponent();
  }
  
  @Get('by-model')
  getUsageByModel() {
    return this.costMonitoringService.getUsageByModel();
  }
}
```

#### 4.6 Cảnh báo chi phí
```typescript
@Injectable()
export class CostAlertService {
  constructor(
    private readonly costMonitoringService: CostMonitoringService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly logger: Logger
  ) {}
  
  @Cron('0 0 * * * *')  // Chạy mỗi giờ
  async checkDailyCostThreshold() {
    const dailyThreshold = this.configService.get<number>('DAILY_COST_THRESHOLD', 1.0);  // $1 mặc định
    const dailyCost = await this.costMonitoringService.getDailyCost();
    
    if (dailyCost.cost >= dailyThreshold) {
      this.logger.warn(`Daily cost threshold exceeded: $${dailyCost.cost} >= $${dailyThreshold}`);
      await this.notificationService.sendAlert({
        title: 'Cost Threshold Alert',
        message: `Daily cost threshold exceeded: $${dailyCost.cost} >= $${dailyThreshold}`,
        level: 'warning'
      });
    }
  }
  
  @Cron('0 0 0 * * *')  // Chạy mỗi ngày
  async checkMonthlyCostThreshold() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const monthlyThreshold = this.configService.get<number>('MONTHLY_COST_THRESHOLD', 10.0);  // $10 mặc định
    
    const monthlyCost = await this.costMonitoringService.getMonthlyCost(year, month);
    
    if (monthlyCost.cost >= monthlyThreshold) {
      this.logger.warn(`Monthly cost threshold exceeded: $${monthlyCost.cost} >= $${monthlyThreshold}`);
      await this.notificationService.sendAlert({
        title: 'Cost Threshold Alert',
        message: `Monthly cost threshold exceeded: $${monthlyCost.cost} >= $${monthlyThreshold}`,
        level: 'warning'
      });
    }
  }
}
```

#### 4.7 Cơ chế token counting
Để tính toán chính xác số lượng token từ prompt và completion, sẽ sử dụng thư viện tiktoken:
```typescript
import { encode } from 'tiktoken';

export function countTokens(text: string, model: string = 'gpt-3.5-turbo'): number {
  const encoder = encode(model);
  const tokens = encoder.encode(text);
  return tokens.length;
}
```

Việc tích hợp Cost Monitoring sẽ giúp theo dõi và kiểm soát chi phí sử dụng LLM một cách hiệu quả, đồng thời cung cấp thông tin chi tiết để có thể tối ưu hóa việc sử dụng prompt và model.