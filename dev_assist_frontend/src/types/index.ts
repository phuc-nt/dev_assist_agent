// Message types for chat
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  status: 'sending' | 'sent' | 'error';
}

// Chat conversation
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// Agent types
export type AgentType = 'central' | 'jira' | 'slack' | 'calendar' | 'email' | 'meetingRoom';

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Cost tracking
export interface TokenUsage {
  requestId: string;
  tokensUsed: number;
  model: string;
  timestamp: string;
  conversation: string;
}

// Integration configurations
export interface Integration {
  type: 'jira' | 'slack' | 'calendar' | 'email' | 'meetingRoom';
  isConnected: boolean;
  lastSynced?: string;
}

// Application settings
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  tokenBudget?: number;
  integrations: Record<string, Integration>;
} 