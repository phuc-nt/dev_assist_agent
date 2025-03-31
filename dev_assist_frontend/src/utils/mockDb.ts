import { Conversation, Message } from '@/types';

// In-memory storage for conversations
export const db = {
  conversations: [] as Conversation[],
  
  // Get all conversations
  getAllConversations(): Conversation[] {
    return [...this.conversations];
  },
  
  // Get a conversation by ID
  getConversation(id: string): Conversation | undefined {
    return this.conversations.find(conv => conv.id === id);
  },
  
  // Add a new conversation
  addConversation(conversation: Conversation): Conversation {
    this.conversations.push(conversation);
    return conversation;
  },
  
  // Delete a conversation by ID
  deleteConversation(id: string): boolean {
    const index = this.conversations.findIndex(conv => conv.id === id);
    
    if (index !== -1) {
      this.conversations.splice(index, 1);
      return true;
    }
    
    return false;
  },
  
  // Add a message to a conversation
  addMessage(conversationId: string, message: Message): Message | null {
    const conversation = this.getConversation(conversationId);
    
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
      return message;
    }
    
    return null;
  },
}; 