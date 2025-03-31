import axios from 'axios';
import { ApiResponse, Conversation, Message } from '@/types';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints for conversations
export const conversationApi = {
  // Get all conversations
  getAll: async (): Promise<ApiResponse<Conversation[]>> => {
    try {
      const response = await api.get<ApiResponse<Conversation[]>>('/conversations');
      return response.data;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return { success: false, error: 'Failed to fetch conversations' };
    }
  },

  // Get a single conversation by ID
  getById: async (id: string): Promise<ApiResponse<Conversation>> => {
    try {
      const response = await api.get<ApiResponse<Conversation>>(`/conversations/${id}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      return { success: false, error: 'Failed to fetch conversation' };
    }
  },

  // Create a new conversation
  create: async (): Promise<ApiResponse<Conversation>> => {
    try {
      const response = await api.post<ApiResponse<Conversation>>('/conversations');
      return response.data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return { success: false, error: 'Failed to create conversation' };
    }
  },

  // Delete a conversation
  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await api.delete<ApiResponse<boolean>>(`/conversations/${id}`);
      return response.data;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      return { success: false, error: 'Failed to delete conversation' };
    }
  },

  // Send a message to a conversation (with OpenAI-like structure)
  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    try {
      // Format the messages in OpenAI Chat Completion format
      const chatCompletionRequest = {
        model: "gpt-4o-mini", // Default model, backend can override this
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        conversation_id: conversationId,
        // Optional parameters that backend might use
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      const response = await api.post<ApiResponse<Message>>(
        `/chat/completions`,
        chatCompletionRequest
      );
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      return { success: false, error: 'Failed to send message' };
    }
  },
  
  // Get conversation history
  getHistory: async (conversationId: string): Promise<ApiResponse<Message[]>> => {
    try {
      const response = await api.get<ApiResponse<Message[]>>(
        `/conversations/${conversationId}/messages`
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching conversation history:', err);
      return { success: false, error: 'Failed to fetch conversation history' };
    }
  }
};

// API endpoints for integrations
export const integrationApi = {
  // Get status of integrations
  getStatus: async (): Promise<ApiResponse<Record<string, boolean>>> => {
    try {
      const response = await api.get<ApiResponse<Record<string, boolean>>>('/integrations/status');
      return response.data;
    } catch (err) {
      console.error('Error fetching integration status:', err);
      return { success: false, error: 'Failed to fetch integration status' };
    }
  },

  // Connect to an integration
  connect: async (
    type: string,
    credentials: Record<string, string>
  ): Promise<ApiResponse<boolean>> => {
    try {
      const response = await api.post<ApiResponse<boolean>>(`/integrations/${type}/connect`, credentials);
      return response.data;
    } catch (err) {
      console.error('Error connecting integration:', err);
      return { success: false, error: 'Failed to connect integration' };
    }
  },

  // Disconnect from an integration
  disconnect: async (type: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await api.post<ApiResponse<boolean>>(`/integrations/${type}/disconnect`);
      return response.data;
    } catch (err) {
      console.error('Error disconnecting integration:', err);
      return { success: false, error: 'Failed to disconnect integration' };
    }
  },
};

// API endpoints for token usage
export const tokenApi = {
  // Get token usage statistics
  getUsage: async (
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<ApiResponse<{ date: string; tokens: number }[]>> => {
    try {
      const response = await api.get<ApiResponse<{ date: string; tokens: number }[]>>(
        `/tokens/usage?period=${period}`
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching token usage:', err);
      return { success: false, error: 'Failed to fetch token usage' };
    }
  },
};

export default api; 