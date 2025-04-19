export interface UserRequest {
  prompt: string;
  userId: string;
  conversationId?: string;
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  metadata?: any;
}

export interface ActionPlan {
  steps: PlanStep[];
  originalPrompt: string;
}

export interface PlanStep {
  agentType: AgentType;
  action: string;
  parameters: any;
  dependsOn?: number; // Index của step trước đó mà step này phụ thuộc vào
}

export enum AgentType {
  CENTRAL = 'CENTRAL',
  JIRA = 'JIRA',
  SLACK = 'SLACK',
  CONFLUENCE = 'CONFLUENCE',
  OPENAI = 'OPENAI',
}

export interface CentralAgentConfig {
  defaultModel: string;
  defaultTemperature: number;
  maxTokensPerRequest: number;
} 