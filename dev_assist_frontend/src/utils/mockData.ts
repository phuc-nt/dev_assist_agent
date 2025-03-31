import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '@/types';

// Lưu trữ dữ liệu mock trong memory
export const mockDB = {
  conversations: [] as Conversation[],
};

// Hàm trả về bot response dựa trên nội dung tin nhắn của user
export function generateBotResponse(userMessage: string): string {
  // Convert to lowercase for easier matching
  const message = userMessage.toLowerCase();

  // Basic responses based on keywords
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('xin chào')) {
    return 'Xin chào! Tôi có thể giúp gì cho bạn với các tác vụ phát triển hôm nay?';
  }
  
  if (message.includes('jira') && (message.includes('tạo') || message.includes('create') || message.includes('new'))) {
    return 'Tôi có thể giúp bạn tạo một issue JIRA mới. Vui lòng cung cấp thông tin như tiêu đề, mô tả và mức độ ưu tiên. Lưu ý: Đây là phản hồi mẫu vì tích hợp JIRA thực tế chưa được triển khai.';
  }
  
  if (message.includes('slack') && message.includes('send')) {
    return 'Tôi có thể giúp bạn gửi tin nhắn trên Slack. Vui lòng chỉ định kênh và nội dung tin nhắn. Lưu ý: Đây là phản hồi mẫu vì tích hợp Slack thực tế chưa được triển khai.';
  }
  
  if (message.includes('cuộc họp') || message.includes('meeting') || message.includes('lịch') || message.includes('calendar')) {
    return 'Tôi có thể hỗ trợ lên lịch các cuộc họp và quản lý lịch của bạn. Vui lòng cung cấp thông tin như ngày, giờ và người tham dự. Lưu ý: Đây là phản hồi mẫu vì tích hợp lịch thực tế chưa được triển khai.';
  }
  
  if (message.includes('help') || message.includes('giúp') || message.includes('what can you do') || message.includes('làm được gì')) {
    return `Tôi có thể hỗ trợ bạn với nhiều tác vụ phát triển, bao gồm:
    
- Tạo và quản lý các issue JIRA
- Gửi tin nhắn trên Slack
- Quản lý lịch và lên lịch các cuộc họp
- Kiểm tra thống kê sử dụng token

Lưu ý: Đây hiện là phiên bản demo với các phản hồi mẫu.`;
  }
  
  // Default response
  return `Tôi hiểu bạn đang hỏi về "${userMessage}". Là DevAssist Bot, tôi được thiết kế để hỗ trợ các tác vụ phát triển và quản lý dự án.

Tôi có thể hỗ trợ với JIRA, Slack, quản lý lịch, và nhiều tác vụ khác. Tuy nhiên, hiện tại tôi đang ở chế độ demo với chức năng giới hạn.

Tôi có thể giúp gì thêm cho bạn?`;
}

// Hàm tạo phản hồi theo chuẩn OpenAI
// Tham số conversationId được giữ lại để đảm bảo tính tương thích với các API call hiện tại
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateOpenAIResponse(message: string, conversationId: string) {
  const botMessage = generateBotResponse(message);
  
  return {
    id: `chatcmpl-${uuidv4()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "gpt-4o-mini",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: botMessage
        },
        finish_reason: "stop"
      }
    ],
    usage: {
      prompt_tokens: message.length,
      completion_tokens: botMessage.length,
      total_tokens: message.length + botMessage.length
    }
  };
}

// Hàm tạo mock conversation mới
export function createMockConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: 'Cuộc hội thoại mới',
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

// Lấy danh sách conversations
export function getMockConversations(): Conversation[] {
  return [...mockDB.conversations];
}

// Lấy conversation theo ID
export function getMockConversationById(id: string): Conversation | undefined {
  return mockDB.conversations.find(c => c.id === id);
}

// Thêm conversation mới
export function addMockConversation(conversation: Conversation): Conversation {
  mockDB.conversations.push(conversation);
  return conversation;
}

// Xóa conversation
export function deleteMockConversation(id: string): boolean {
  const initialLength = mockDB.conversations.length;
  mockDB.conversations = mockDB.conversations.filter(c => c.id !== id);
  return initialLength > mockDB.conversations.length;
}

// Thêm message vào conversation
export function addMockMessage(conversationId: string, message: Message): Message | null {
  const conversation = getMockConversationById(conversationId);
  if (!conversation) return null;
  
  conversation.messages.push(message);
  conversation.updatedAt = new Date().toISOString();
  
  // Cập nhật tiêu đề nếu là tin nhắn đầu tiên
  if (conversation.title === 'Cuộc hội thoại mới' && 
      message.sender === 'user' && 
      conversation.messages.filter(m => m.sender === 'user').length === 1) {
    conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
  }
  
  return message;
} 