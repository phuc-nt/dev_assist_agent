import env from '../config/env';
import { JiraProject, JiraIssue, ServiceResult } from '../types';

// Đọc thông tin cấu hình project từ tệp project_config_demo.json
// Trong thực tế, chúng ta nên đọc từ file cấu hình riêng và quản lý đúng cách
const JIRA_DOMAIN = 'https://phuc-nt.atlassian.net';
const JIRA_PROJECT_KEY = 'XDEMO2';

// Cấu hình cơ bản cho các yêu cầu API Jira
const JIRA_API_BASE = `${JIRA_DOMAIN}/rest/api/3`;
const AUTH_HEADER = `Basic ${Buffer.from(`${env.jira.email}:${env.jira.apiToken}`).toString('base64')}`;

/**
 * Xử lý lỗi API từ Jira
 */
function handleJiraError(error: any): ServiceResult<any> {
  console.error('JIRA API Error:', error);
  
  return {
    success: false,
    error: {
      message: error.message || 'Unknown JIRA API error',
      code: error.statusCode || 'UNKNOWN_ERROR',
      details: error.response?.data || {},
    },
  };
}

/**
 * Lấy danh sách tất cả các dự án trong Jira
 */
export async function fetchProjects(): Promise<ServiceResult<{ projects: JiraProject[] }>> {
  try {
    const response = await fetch(`${JIRA_API_BASE}/project`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const projects = await response.json();
    
    return {
      success: true,
      data: {
        projects: projects.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          url: `${project.self.split('/rest/api')[0]}/browse/${project.key}`
        }))
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
}

/**
 * Tìm kiếm các vấn đề bằng JQL (Jira Query Language)
 */
export async function searchIssues(jql: string): Promise<ServiceResult<{ total: number, issues: JiraIssue[] }>> {
  try {
    // Nếu không chỉ định project, thêm vào JQL
    if (!jql.includes('project =')) {
      jql = `project = ${JIRA_PROJECT_KEY} AND ${jql}`;
    }
    
    const response = await fetch(`${JIRA_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'priority', 'created', 'updated', 'description']
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search issues: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        total: result.total,
        issues: result.issues.map((issue: any) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
          priority: issue.fields.priority?.name,
          created: issue.fields.created,
          updated: issue.fields.updated,
          url: `${issue.self.split('/rest/api')[0]}/browse/${issue.key}`
        }))
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
}

/**
 * Lấy thông tin chi tiết về một vấn đề cụ thể
 */
export async function getIssue(issueIdOrKey: string): Promise<ServiceResult<JiraIssue>> {
  try {
    const response = await fetch(`${JIRA_API_BASE}/issue/${issueIdOrKey}`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get issue: ${response.statusText}`);
    }
    
    const issue = await response.json();
    
    return {
      success: true,
      data: {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status?.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        priority: issue.fields.priority?.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        url: `${issue.self.split('/rest/api')[0]}/browse/${issue.key}`
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
}

/**
 * Tạo một vấn đề mới trong Jira
 */
export async function createIssue(
  summary: string, 
  description: string, 
  issueType: string,
  projectKey: string = JIRA_PROJECT_KEY
): Promise<ServiceResult<JiraIssue>> {
  try {
    const response = await fetch(`${JIRA_API_BASE}/issue`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: projectKey
          },
          summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: description
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueType
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create issue: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        id: result.id,
        key: result.key,
        summary,
        description,
        url: `${result.self.split('/rest/api')[0]}/browse/${result.key}`
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
}

/**
 * Cập nhật trạng thái vấn đề trong Jira
 */
export async function updateIssueStatus(issueIdOrKey: string, statusName: string): Promise<ServiceResult<{ key: string, status: string }>> {
  try {
    // 1. Lấy thông tin về vấn đề để xác định các transition có sẵn
    const issueResponse = await fetch(`${JIRA_API_BASE}/issue/${issueIdOrKey}/transitions`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!issueResponse.ok) {
      throw new Error(`Failed to get issue transitions: ${issueResponse.statusText}`);
    }
    
    const transitionsData = await issueResponse.json();
    
    // 2. Tìm ID transition phù hợp với trạng thái mong muốn
    const transition = transitionsData.transitions.find(
      (t: any) => t.to.name.toLowerCase() === statusName.toLowerCase()
    );
    
    if (!transition) {
      throw new Error(`No transition found for status: ${statusName}`);
    }
    
    // 3. Thực hiện transition
    const updateResponse = await fetch(`${JIRA_API_BASE}/issue/${issueIdOrKey}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transition: { id: transition.id }
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update issue status: ${updateResponse.statusText}`);
    }
    
    return {
      success: true,
      data: {
        key: issueIdOrKey,
        status: statusName
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
}

/**
 * Thêm bình luận vào vấn đề trong Jira
 */
export async function addComment(issueIdOrKey: string, commentText: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const response = await fetch(`${JIRA_API_BASE}/issue/${issueIdOrKey}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: commentText
                }
              ]
            }
          ]
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        id: result.id
      }
    };
  } catch (error: any) {
    return handleJiraError(error);
  }
} 