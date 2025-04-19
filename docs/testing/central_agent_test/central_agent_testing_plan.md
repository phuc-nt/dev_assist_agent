# Kế hoạch kiểm thử Central Agent

Tài liệu này trình bày chi tiết kế hoạch kiểm thử cho Central Agent, bao gồm các loại kiểm thử, kịch bản kiểm thử cụ thể và các tiêu chí đánh giá để đảm bảo tính ổn định và độ tin cậy của hệ thống.

## 1. Unit Testing

### 1.1 Input Processor

**Mục tiêu kiểm thử**:
- Đảm bảo Input Processor có thể phân tích chính xác văn bản đầu vào
- Kiểm tra xử lý nhiều loại yêu cầu khác nhau
- Kiểm tra khả năng xử lý ngữ cảnh hội thoại

**Test cases**:

1. **Phân tích yêu cầu đơn giản**:
   ```typescript
   it('should process simple completion request', async () => {
     const userInput = 'tôi xong việc hôm nay rồi';
     const context = mockContext();
     
     const result = await inputProcessor.processInput(userInput, context);
     
     expect(result).toContain('hoàn thành');
     expect(result).toContain('task');
     expect(result).toContain('XDEMO2');
   });
   ```

2. **Phân tích yêu cầu phức tạp**:
   ```typescript
   it('should process complex request with details', async () => {
     const userInput = 'tạo task mới cho Nam để implement tính năng đăng nhập, deadline cuối tuần';
     const context = mockContext();
     
     const result = await inputProcessor.processInput(userInput, context);
     
     expect(result).toContain('tạo task');
     expect(result).toContain('Nam');
     expect(result).toContain('deadline');
   });
   ```

3. **Xử lý ngữ cảnh hội thoại**:
   ```typescript
   it('should handle conversational context', async () => {
     const conversationHistory = [
       { role: 'user', content: 'tìm task của tôi', timestamp: new Date() },
       { role: 'assistant', content: 'Đã tìm thấy 3 task: XDEMO2-5, XDEMO2-7, XDEMO2-8', timestamp: new Date() }
     ];
     
     const userInput = 'cập nhật task đầu tiên sang done';
     const context = mockContext(conversationHistory);
     
     const result = await inputProcessor.processInput(userInput, context);
     
     expect(result).toContain('XDEMO2-5');
     expect(result).toContain('Done');
   });
   ```

4. **Xử lý yêu cầu không rõ ràng**:
   ```typescript
   it('should identify ambiguous requests', async () => {
     const userInput = 'cập nhật';
     const context = mockContext();
     
     const result = await inputProcessor.processInput(userInput, context);
     
     expect(result).toContain('không rõ');
     // hoặc phải bao gồm các thông tin cần làm rõ
   });
   ```

### 1.2 Action Planner

**Mục tiêu kiểm thử**:
- Kiểm tra khả năng tạo kế hoạch từ mô tả yêu cầu
- Đảm bảo xử lý các dependency giữa các bước
- Kiểm tra điều kiện thực thi
- Kiểm tra xử lý lỗi khi parse LLM response

**Test cases**:

1. **Tạo kế hoạch đơn giản**:
   ```typescript
   it('should create a simple plan', async () => {
     const processedInput = 'Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành task hôm nay...';
     
     const plan = await actionPlanner.createPlan(processedInput);
     
     expect(plan.steps.length).toBeGreaterThan(0);
     expect(plan.steps[0].agentType).toBe('JIRA');
     expect(plan.status).toBe('CREATED');
   });
   ```

2. **Xử lý dependency giữa các bước**:
   ```typescript
   it('should handle dependencies between steps', async () => {
     const processedInput = 'Người dùng muốn cập nhật task và thông báo cho team...';
     
     const plan = await actionPlanner.createPlan(processedInput);
     
     const updateStep = plan.steps.find(s => s.prompt.includes('cập nhật'));
     const notifyStep = plan.steps.find(s => s.prompt.includes('thông báo'));
     
     expect(notifyStep.dependsOn).toContain(updateStep.id);
   });
   ```

3. **Thêm điều kiện thực thi**:
   ```typescript
   it('should add execution conditions', async () => {
     const processedInput = 'Người dùng muốn tìm task và cập nhật nếu có...';
     
     const plan = await actionPlanner.createPlan(processedInput);
     
     const updateStep = plan.steps.find(s => s.prompt.includes('cập nhật'));
     
     expect(updateStep.condition).toBeTruthy();
     expect(updateStep.condition).toContain('length > 0');
   });
   ```

4. **Xử lý lỗi LLM Response**:
   ```typescript
   it('should handle invalid LLM responses', async () => {
     // Mock LLM service trả về response không hợp lệ
     llmServiceMock.complete.mockResolvedValue({ text: 'Invalid response without JSON' });
     
     await expect(
       actionPlanner.createPlan('Some input')
     ).rejects.toThrow('Không thể tạo kế hoạch');
   });
   ```

### 1.3 Agent Coordinator

**Mục tiêu kiểm thử**:
- Kiểm tra logic thực thi kế hoạch
- Kiểm tra xử lý phụ thuộc giữa các bước
- Kiểm tra cơ chế retry
- Kiểm tra render template prompt với context

**Test cases**:

1. **Thực thi kế hoạch**:
   ```typescript
   it('should execute action plan', async () => {
     const plan = mockActionPlan();
     
     const result = await agentCoordinator.executeActionPlan(plan);
     
     expect(result.status).toBe('COMPLETED');
     expect(result.steps[0].status).toBe('SUCCEEDED');
   });
   ```

2. **Xử lý phụ thuộc giữa các bước**:
   ```typescript
   it('should respect dependencies between steps', async () => {
     const plan = mockActionPlan();
     plan.steps[1].dependsOn = [plan.steps[0].id];
     
     // Mock step đầu tiên thất bại
     mockAgentWithFailure(plan.steps[0].agentType);
     
     const result = await agentCoordinator.executeActionPlan(plan);
     
     expect(result.steps[0].status).toBe('FAILED');
     expect(result.steps[1].status).toBe('SKIPPED'); // or 'WAITING'
   });
   ```

3. **Cơ chế retry**:
   ```typescript
   it('should retry failed steps', async () => {
     const plan = mockActionPlan();
     plan.steps[0].maxRetries = 2;
     
     // Mock agent fail lần đầu, success lần thứ 2
     mockAgentWithRetrySuccess(plan.steps[0].agentType);
     
     const result = await agentCoordinator.executeActionPlan(plan);
     
     expect(result.steps[0].retryCount).toBe(1);
     expect(result.steps[0].status).toBe('SUCCEEDED');
   });
   ```

4. **Render prompt template**:
   ```typescript
   it('should correctly render prompt templates', async () => {
     const context = {
       result: {
         step1: {
           data: {
             issues: [{ key: 'TEST-1', summary: 'Test issue' }]
           }
         }
       }
     };
     
     const template = 'Update issues: {result.step1.data.issues.map(i => i.key).join(", ")}';
     
     const rendered = agentCoordinator.renderPromptTemplate(template, context);
     
     expect(rendered).toBe('Update issues: TEST-1');
   });
   ```

5. **Đánh giá điều kiện step**:
   ```typescript
   it('should evaluate step conditions', async () => {
     const plan = mockActionPlan();
     plan.steps[1].condition = 'result.step1.data.issues.length > 0';
     
     // Mock context sau khi step1 thành công với issues rỗng
     plan.executionContext.result = {
       step1: {
         data: { issues: [] }
       }
     };
     
     const result = await agentCoordinator.executeActionPlan(plan);
     
     expect(result.steps[1].status).toBe('SKIPPED');
   });
   ```

### 1.4 Result Synthesizer

**Mục tiêu kiểm thử**:
- Kiểm tra khả năng tổng hợp kết quả
- Kiểm tra xử lý các trường hợp thành công/thất bại
- Kiểm tra định dạng phản hồi

**Test cases**:

1. **Tổng hợp kết quả thành công**:
   ```typescript
   it('should synthesize successful results', async () => {
     const plan = mockSuccessfulPlan();
     
     const result = await resultSynthesizer.synthesizeResult(plan);
     
     expect(result).toContain('hoàn thành');
     expect(result).toContain('3 task');
     expect(result).not.toContain('lỗi');
   });
   ```

2. **Tổng hợp kết quả thất bại**:
   ```typescript
   it('should synthesize failed results', async () => {
     const plan = mockFailedPlan();
     
     const result = await resultSynthesizer.synthesizeResult(plan);
     
     expect(result).toContain('không thể');
     expect(result).toContain('lỗi');
     expect(result).toContain(plan.steps[0].error.message);
   });
   ```

3. **Tổng hợp kết quả một phần**:
   ```typescript
   it('should synthesize partially completed results', async () => {
     const plan = mockPartialPlan();
     
     const result = await resultSynthesizer.synthesizeResult(plan);
     
     expect(result).toContain('một phần');
     expect(result).toContain('đã tìm thấy');
     expect(result).toContain('không thể cập nhật');
   });
   ```

## 2. Integration Testing

### 2.1 Luồng xử lý end-to-end

**Mục tiêu kiểm thử**:
- Kiểm tra toàn bộ quy trình từ nhận yêu cầu đến trả kết quả
- Kiểm tra tích hợp giữa các thành phần
- Kiểm tra xử lý đồng thời nhiều yêu cầu

**Test cases**:

1. **Luồng hoàn chỉnh cho báo cáo hoàn thành công việc**:
   ```typescript
   it('should process complete workflow for task completion', async () => {
     const centralAgent = setupCentralAgent();
     const userInput = 'tôi xong việc hôm nay rồi';
     
     const result = await centralAgent.processRequest(userInput, 'user123', []);
     
     expect(result).toContain('hoàn thành');
     // Kiểm tra database để xác nhận các task đã được cập nhật
     const updatedTasks = await jiraDbMock.findTasks({ status: 'Done' });
     expect(updatedTasks.length).toBeGreaterThan(0);
   });
   ```

2. **Luồng hoàn chỉnh cho tạo task mới**:
   ```typescript
   it('should process complete workflow for creating new task', async () => {
     const centralAgent = setupCentralAgent();
     const userInput = 'tạo task cho Nam implement tính năng login, deadline thứ 6';
     
     const result = await centralAgent.processRequest(userInput, 'user123', []);
     
     expect(result).toContain('đã tạo');
     // Kiểm tra database để xác nhận task mới đã được tạo
     const newTask = await jiraDbMock.findTasks({ summary: expect.stringContaining('login') });
     expect(newTask[0].assignee).toBe('nam');
     expect(newTask[0].dueDate).toContain('Friday');
   });
   ```

3. **Xử lý nhiều yêu cầu đồng thời**:
   ```typescript
   it('should handle concurrent requests', async () => {
     const centralAgent = setupCentralAgent();
     
     const request1 = centralAgent.processRequest('tôi xong việc hôm nay rồi', 'user1', []);
     const request2 = centralAgent.processRequest('tạo task mới', 'user2', []);
     
     const [result1, result2] = await Promise.all([request1, request2]);
     
     expect(result1).toBeTruthy();
     expect(result2).toBeTruthy();
   });
   ```

### 2.2 Tích hợp với Sub-Agents

**Mục tiêu kiểm thử**:
- Kiểm tra giao tiếp với JIRA Agent
- Kiểm tra giao tiếp với Slack Agent
- Kiểm tra xử lý kết quả trả về

**Test cases**:

1. **Tích hợp với JIRA Agent - Tìm kiếm issues**:
   ```typescript
   it('should search issues via JIRA Agent', async () => {
     const centralAgent = setupCentralAgent();
     
     // Search tasks request
     const response = await centralAgent.processRequest('tìm các task của tôi', 'user123', []);
     
     expect(response).toContain('Đã tìm thấy');
     expect(jiraAgentMock.executePrompt).toHaveBeenCalledWith(
       expect.stringContaining('tìm kiếm'),
       expect.any(Object)
     );
   });
   ```

2. **Tích hợp với JIRA Agent - Cập nhật issues**:
   ```typescript
   it('should update issues via JIRA Agent', async () => {
     const centralAgent = setupCentralAgent();
     
     const response = await centralAgent.processRequest('cập nhật XDEMO-1 sang done', 'user123', []);
     
     expect(response).toContain('Đã cập nhật');
     expect(jiraAgentMock.executePrompt).toHaveBeenCalledWith(
       expect.stringContaining('cập nhật'),
       expect.any(Object)
     );
   });
   ```

3. **Tích hợp với Slack Agent**:
   ```typescript
   it('should send message via Slack Agent', async () => {
     const centralAgent = setupCentralAgent();
     
     const response = await centralAgent.processRequest('thông báo đã hoàn thành task cho team', 'user123', []);
     
     expect(response).toContain('đã thông báo');
     expect(slackAgentMock.executePrompt).toHaveBeenCalledWith(
       expect.stringContaining('gửi tin nhắn'),
       expect.any(Object)
     );
   });
   ```

### 2.3 Xử lý ngữ cảnh

**Mục tiêu kiểm thử**:
- Kiểm tra cách hệ thống xử lý ngữ cảnh trong hội thoại
- Kiểm tra tham chiếu đến các object từ hội thoại trước

**Test cases**:

1. **Xử lý tham chiếu trong hội thoại**:
   ```typescript
   it('should handle references in conversation', async () => {
     const centralAgent = setupCentralAgent();
     
     // First request
     await centralAgent.processRequest('tìm các task của tôi', 'user123', []);
     
     // Second request referring to previous result
     const conversationHistory = [
       { role: 'user', content: 'tìm các task của tôi', timestamp: new Date() },
       { role: 'assistant', content: 'Đã tìm thấy các task: XDEMO-1, XDEMO-2', timestamp: new Date() }
     ];
     
     const response = await centralAgent.processRequest('cập nhật task đầu tiên sang done', 'user123', conversationHistory);
     
     expect(response).toContain('Đã cập nhật XDEMO-1');
     expect(jiraAgentMock.executePrompt).toHaveBeenCalledWith(
       expect.stringContaining('XDEMO-1'),
       expect.any(Object)
     );
   });
   ```

2. **Xử lý đa bước với ngữ cảnh hội thoại**:
   ```typescript
   it('should handle multi-turn conversation', async () => {
     const centralAgent = setupCentralAgent();
     
     // First turn
     await centralAgent.processRequest('tạo task mới', 'user123', []);
     
     // Second turn
     let conversationHistory = [
       { role: 'user', content: 'tạo task mới', timestamp: new Date() },
       { role: 'assistant', content: 'Task cần có title gì?', timestamp: new Date() }
     ];
     
     await centralAgent.processRequest('Cập nhật tính năng đăng nhập', 'user123', conversationHistory);
     
     // Third turn
     conversationHistory = [
       ...conversationHistory,
       { role: 'user', content: 'Cập nhật tính năng đăng nhập', timestamp: new Date() },
       { role: 'assistant', content: 'Ai sẽ thực hiện task này?', timestamp: new Date() }
     ];
     
     const response = await centralAgent.processRequest('Nam', 'user123', conversationHistory);
     
     expect(response).toContain('Đã tạo task');
     expect(response).toContain('Cập nhật tính năng đăng nhập');
     expect(response).toContain('Nam');
   });
   ```

## 3. Kịch bản kiểm thử

### 3.1 Báo cáo hoàn thành công việc

**Input**: "tôi xong việc hôm nay rồi"

**Setup**:
- Mock JIRA API với 3 issues thuộc về người dùng hiện tại
- Mock Slack API

**Expected Flow**:
1. Input Processor phân tích và hiểu đúng ý định
2. Action Planner tạo kế hoạch 3 bước (tìm kiếm issue, cập nhật trạng thái, thông báo)
3. Agent Coordinator thực thi từng bước theo thứ tự và dependency
4. Result Synthesizer tổng hợp và trả về thông báo thành công

**Variations**:
- **Không có task nào để cập nhật**:
  ```typescript
  it('should handle no tasks to update', async () => {
    // Mock JIRA API trả về empty list
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: true,
      data: { issues: [] }
    });
    
    const response = await centralAgent.processRequest('tôi xong việc hôm nay rồi', 'user123', []);
    
    expect(response).toContain('không tìm thấy task nào');
    expect(slackAgentMock.executePrompt).not.toHaveBeenCalled();
  });
  ```

- **Lỗi khi cập nhật task**:
  ```typescript
  it('should handle update task error', async () => {
    // Mock JIRA API search success
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: true,
      data: { issues: [{ key: 'XDEMO-1', summary: 'Task 1' }] }
    });
    
    // Mock JIRA API update failure
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: false,
      error: { message: 'Invalid transition' }
    });
    
    const response = await centralAgent.processRequest('tôi xong việc hôm nay rồi', 'user123', []);
    
    expect(response).toContain('không thể cập nhật');
    expect(response).toContain('Invalid transition');
    expect(slackAgentMock.executePrompt).not.toHaveBeenCalled();
  });
  ```

- **Lỗi khi gửi thông báo Slack**:
  ```typescript
  it('should handle slack notification error', async () => {
    // Mock JIRA API success
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: true,
      data: { issues: [{ key: 'XDEMO-1', summary: 'Task 1' }] }
    });
    
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: true,
      data: { updated: ['XDEMO-1'] }
    });
    
    // Mock Slack API failure
    slackAgentMock.executePrompt.mockResolvedValueOnce({
      success: false,
      error: { message: 'Channel not found' }
    });
    
    const response = await centralAgent.processRequest('tôi xong việc hôm nay rồi', 'user123', []);
    
    expect(response).toContain('đã cập nhật task');
    expect(response).toContain('không thể gửi thông báo');
  });
  ```

### 3.2 Tạo nhiệm vụ mới

**Input**: "tạo task mới cho Nam để implement tính năng đăng nhập, deadline cuối tuần"

**Setup**:
- Mock JIRA API để tạo issue
- Mock Project Config với thông tin về user Nam

**Expected Flow**:
1. Input Processor hiểu đúng ý định tạo task, người được gán, deadline
2. Action Planner tạo kế hoạch 2 bước (tạo JIRA issue, thông báo)
3. Agent Coordinator thực thi các bước
4. Result Synthesizer tổng hợp và trả về thông tin task đã tạo

**Variations**:
- **Không tìm thấy user Nam**:
  ```typescript
  it('should handle user not found', async () => {
    // Mock JIRA API trả về lỗi không tìm thấy user
    jiraAgentMock.executePrompt.mockResolvedValueOnce({
      success: false,
      error: { message: 'User Nam not found' }
    });
    
    const response = await centralAgent.processRequest(
      'tạo task mới cho Nam để implement tính năng đăng nhập, deadline cuối tuần',
      'user123',
      []
    );
    
    expect(response).toContain('không thể tạo task');
    expect(response).toContain('User Nam not found');
  });
  ```

- **Thiếu thông tin project**:
  ```typescript
  it('should handle missing project info', async () => {
    // Mock project config without project info
    projectConfigReaderMock.getProjectContext.mockResolvedValueOnce({
      user: { id: 'user123', name: 'Test User' }
      // No project info
    });
    
    const response = await centralAgent.processRequest(
      'tạo task mới cho Nam để implement tính năng đăng nhập, deadline cuối tuần',
      'user123',
      []
    );
    
    expect(response).toContain('cần thêm thông tin về project');
  });
  ```

### 3.3 Quản lý lỗi và retry

**Input**: "cập nhật trạng thái tất cả các ticket của tôi sang Done"

**Test Scenario**:
```typescript
it('should handle retry for failed transition', async () => {
  // Mock search issues success
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: {
      issues: [
        { key: 'XDEMO-1', summary: 'Task 1', status: 'To Do' },
        { key: 'XDEMO-2', summary: 'Task 2', status: 'In Progress' }
      ]
    }
  });
  
  // Mock update failure - invalid transition
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: false,
    error: { message: 'Cannot transition from To Do to Done directly' }
  });
  
  // Mock retry success
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: { updated: ['XDEMO-1', 'XDEMO-2'] }
  });
  
  const response = await centralAgent.processRequest(
    'cập nhật trạng thái tất cả các ticket của tôi sang Done',
    'user123',
    []
  );
  
  expect(response).toContain('đã cập nhật');
  expect(jiraAgentMock.executePrompt).toHaveBeenCalledTimes(3);
  
  // Second call should contain adjusted prompt
  const secondCallPrompt = jiraAgentMock.executePrompt.mock.calls[1][0];
  expect(secondCallPrompt).toContain('transition');
});
```

### 3.4 Đánh giá điều kiện và quản lý phụ thuộc

**Input**: "gửi nhắc nhở hoàn thành task cho team"

**Test Scenario**:
```typescript
it('should properly evaluate conditions and dependencies', async () => {
  // Setup mock plan với 3 steps:
  // 1. Tìm tasks chưa hoàn thành
  // 2. Tìm thông tin người được gán (phụ thuộc vào step 1)
  // 3. Gửi thông báo cho team (phụ thuộc vào step 1 & 2, với điều kiện có tasks)
  
  // Mock search tasks success
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: {
      issues: [
        { key: 'XDEMO-1', summary: 'Task 1', assignee: 'user1' },
        { key: 'XDEMO-2', summary: 'Task 2', assignee: 'user2' }
      ]
    }
  });
  
  // Mock get assignee info
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: {
      users: [
        { id: 'user1', displayName: 'User One' },
        { id: 'user2', displayName: 'User Two' }
      ]
    }
  });
  
  // Mock slack message
  slackAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: { messageId: '123456' }
  });
  
  const response = await centralAgent.processRequest(
    'gửi nhắc nhở hoàn thành task cho team',
    'user123',
    []
  );
  
  expect(response).toContain('đã gửi nhắc nhở');
  expect(jiraAgentMock.executePrompt).toHaveBeenCalledTimes(2);
  expect(slackAgentMock.executePrompt).toHaveBeenCalledTimes(1);
  
  // Verify that the Slack prompt includes info from both previous steps
  const slackPrompt = slackAgentMock.executePrompt.mock.calls[0][0];
  expect(slackPrompt).toContain('Task 1');
  expect(slackPrompt).toContain('User One');
});

it('should skip steps when condition is not met', async () => {
  // Mock search tasks with empty result
  jiraAgentMock.executePrompt.mockResolvedValueOnce({
    success: true,
    data: { issues: [] }
  });
  
  const response = await centralAgent.processRequest(
    'gửi nhắc nhở hoàn thành task cho team',
    'user123',
    []
  );
  
  expect(response).toContain('không có task nào');
  expect(jiraAgentMock.executePrompt).toHaveBeenCalledTimes(1);
  expect(slackAgentMock.executePrompt).not.toHaveBeenCalled();
});
```

## 4. Metrics và Tiêu chí đánh giá

### 4.1 Độ chính xác

| Metric | Target | Phương pháp đo |
|--------|--------|----------------|
| **% yêu cầu được hiểu đúng** | > 90% | Kiểm tra output của Input Processor trên tập test với expectation predefined |
| **% kế hoạch được tạo hợp lý** | > 85% | Human evaluation của ActionPlan được tạo bởi Action Planner |
| **% thực thi thành công** | > 95% | Số lượng test case thành công / tổng số test case |
| **% tổng hợp kết quả đúng** | > 90% | Kiểm tra output của Result Synthesizer với ground truth |

### 4.2 Hiệu suất

| Metric | Target | Phương pháp đo |
|--------|--------|----------------|
| **Thời gian xử lý trung bình** | < 5s | Đo thời gian từ nhận yêu cầu đến trả kết quả |
| **Độ trễ giữa các bước** | < 300ms | Thời gian giữa các bước trong quy trình |
| **Yêu cầu xử lý đồng thời** | > 10 req/s | Load testing với tool như JMeter |
| **Tỷ lệ retry** | < 5% | Số lần retry / tổng số lần gọi agent |

### 4.3 Độ ổn định

| Metric | Target | Phương pháp đo |
|--------|--------|----------------|
| **Tỷ lệ lỗi** | < 1% | Số lần lỗi / tổng số lần request |
| **Khả năng phục hồi** | 100% | % trường hợp lỗi có retry thành công |
| **Thời gian uptime** | > 99.9% | Thời gian service hoạt động / tổng thời gian |

### 4.4 Tính linh hoạt

| Metric | Target | Phương pháp đo |
|--------|--------|----------------|
| **Độ đa dạng yêu cầu** | > 30 loại | Số loại yêu cầu khác nhau hỗ trợ |
| **Khả năng mở rộng** | < 2 days | Thời gian để thêm một Sub-Agent mới |
| **Thích ứng API thay đổi** | < 4h | Thời gian để điều chỉnh khi API của Sub-Agent thay đổi |

## 5. Môi trường kiểm thử

### 5.1 Môi trường development

- **Unit tests**: Chạy trên local developer machine và CI
- **Mock data**: Sử dụng mock data cho tất cả các API calls
- **Test runner**: Jest

### 5.2 Môi trường staging

- **Integration tests**: Chạy trên môi trường staging
- **Mock Agents**: Sử dụng mock Sub-Agents với behavior giống production
- **Database**: Sử dụng staging database

### 5.3 Môi trường production

- **Smoke tests**: Kiểm tra cơ bản sau mỗi deployment
- **Canary testing**: Deploy cho một phần nhỏ người dùng trước
- **Monitoring**: Theo dõi metrics và logs

## 6. Kế hoạch triển khai kiểm thử

1. **Thiết lập framework kiểm thử** (Sprint 1)
   - Setup Jest và các thư viện testing
   - Tạo các mock và fixtures cần thiết
   - Định nghĩa các helper functions

2. **Phát triển unit tests** (Sprint 1-2)
   - Viết tests cho từng module
   - Đảm bảo coverage > 80%

3. **Phát triển integration tests** (Sprint 2-3)
   - Viết tests cho các luồng end-to-end
   - Kiểm thử tích hợp giữa các module

4. **Performance testing** (Sprint 3)
   - Thiết lập benchmark
   - Kiểm tra dưới tải cao

5. **User acceptance testing** (Sprint 4)
   - Kiểm thử với các tình huống thực tế
   - Thu thập feedback và điều chỉnh 