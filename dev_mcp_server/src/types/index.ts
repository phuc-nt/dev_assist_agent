// Các kiểu dữ liệu chung cho toàn bộ dự án

// Kiểu dữ liệu cho dự án Jira
export interface JiraProject {
  id: string;
  key: string;
  name: string;
  url: string;
}

// Kiểu dữ liệu cho issue Jira
export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status?: string;
  assignee?: string;
  reporter?: string;
  priority?: string;
  created?: string;
  updated?: string;
  url: string;
}

// Kiểu dữ liệu cho không gian Confluence
export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type?: string;
  url: string;
}

// Kiểu dữ liệu cho trang Confluence
export interface ConfluencePage {
  id: string;
  title: string;
  spaceKey?: string;
  content?: string;
  version?: number;
  lastUpdated?: string;
  url: string;
}

// Kiểu dữ liệu kết quả chung
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
} 