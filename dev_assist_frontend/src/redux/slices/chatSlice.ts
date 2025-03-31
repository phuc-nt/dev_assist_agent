import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Create a new conversation
    createConversation: {
      reducer: (state, action: PayloadAction<Conversation>) => {
        state.conversations.push(action.payload);
        state.activeConversationId = action.payload.id;
      },
      prepare: (conversation?: Partial<Conversation>) => {
        const now = new Date().toISOString();
        return {
          payload: {
            id: conversation?.id || uuidv4(),
            title: conversation?.title || 'New Conversation',
            messages: conversation?.messages || [],
            createdAt: conversation?.createdAt || now,
            updatedAt: conversation?.updatedAt || now,
          },
        };
      },
    },
    
    // Set active conversation
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    
    // Add a new message to a conversation
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Omit<Message, 'id' | 'timestamp'> }>) => {
      const { conversationId, message } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      
      if (conversation) {
        const newMessage: Message = {
          ...message,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        };
        
        conversation.messages.push(newMessage);
        conversation.updatedAt = new Date().toISOString();
        
        // Update title for new conversations with first user message
        if (conversation.title === 'New Conversation' && message.sender === 'user') {
          conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }
      }
    },
    
    // Update message status
    updateMessageStatus: (state, action: PayloadAction<{ conversationId: string; messageId: string; status: Message['status'] }>) => {
      const { conversationId, messageId, status } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          message.status = status;
        }
      }
    },
    
    // Delete a conversation
    deleteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(c => c.id !== conversationId);
      
      // If the active conversation was deleted, set the first available as active
      if (state.activeConversationId === conversationId) {
        state.activeConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear chat history
    clearAllConversations: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
    },
  },
});

export const {
  createConversation,
  setActiveConversation,
  addMessage,
  updateMessageStatus,
  deleteConversation,
  setLoading,
  setError,
  clearAllConversations,
} = chatSlice.actions;

export default chatSlice.reducer; 