import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import { EnhancedLogger } from '../../utils/logger';

@Injectable()
export class InputProcessor {
  private readonly logger = EnhancedLogger.getLogger(InputProcessor.name);
  
  constructor(private readonly openaiService: OpenaiService) {}
  
  async processInput(userInput: string, context: any): Promise<string> {
    this.logger.log(`Bắt đầu xử lý yêu cầu: "${userInput}"`);
    
    // Chuẩn bị prompt cho OpenAI
    this.logger.debug('Tạo system prompt và user prompt...');
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(userInput, context);
    
    // Gọi OpenAI API
    this.logger.log('Gửi yêu cầu đến OpenAI API...');
    const startTime = Date.now();
    const response = await this.openaiService.chatWithFunctionCalling(systemPrompt, userPrompt);
    const processingTime = Date.now() - startTime;
    this.logger.log(`Nhận phản hồi từ OpenAI API sau ${processingTime}ms`);
    this.logger.debug(`Phản hồi từ OpenAI: ${response.substring(0, 100)}...`);
    
    // Trả về kết quả phân tích
    this.logger.log('Hoàn thành xử lý yêu cầu');
    return response;
  }
  
  private getSystemPrompt(): string {
    this.logger.debug('Tạo system prompt cho InputProcessor');
    return `
Bạn là một AI assistant được thiết kế để phân tích yêu cầu người dùng và chuyển thành mô tả chi tiết.

Với mỗi yêu cầu, hãy:
1. Phân tích ý định chính
2. Xác định các thông tin quan trọng (user, project, time, etc.)
3. Mô tả chi tiết những gì người dùng muốn thực hiện

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
Ví dụ:
Input: "tôi xong việc hôm nay rồi"
Output:
"Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành tất cả công việc được giao trong ngày hôm nay. Họ muốn:
1. Cập nhật trạng thái các task được giao cho họ trong dự án XDEMO2 thành "Done"
2. Thông báo cho team về việc hoàn thành công việc

Ngữ cảnh: Yêu cầu được gửi vào cuối ngày làm việc, liên quan đến dự án XDEMO2, và cần thông báo cho team."
    `;
  }
  
  private getUserPrompt(userInput: string, context: any): string {
    this.logger.debug('Tạo user prompt với context cho InputProcessor');
    const historyText = context.conversationHistory?.slice(-3)
      .map(h => `${h.role}: ${h.content}`)
      .join('\n') || 'Không có';
      
    return `
Phân tích yêu cầu sau của người dùng: "${userInput}"

Thông tin ngữ cảnh:
- Người dùng: ${context.user.name}
- Dự án: ${context.project?.key || 'Không xác định'}
- Lịch sử hội thoại: 
${historyText}

Mô tả chi tiết:
1. Ý định của người dùng và các hành động cần thiết
2. Các thông tin cần thiết như project, timeline, status, v.v.
3. Bất kỳ ngữ cảnh bổ sung nào

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
    `;
  }
} 