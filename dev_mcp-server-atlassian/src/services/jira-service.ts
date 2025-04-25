import { callJiraApi, AtlassianConfig } from '../utils/atlassian-api.js';
import { ApiErrorType } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';
import { 
  JiraIssue, 
  JiraProject, 
  JiraSearchParams, 
  JiraSearchResult, 
  JiraTransitionsResult,
  JiraCreateIssueParams,
  JiraComment
} from '../utils/jira-interfaces.js';

/**
 * Service class để tương tác với Jira API
 */
export class JiraService {
  private logger: Logger;
  private config: AtlassianConfig;

  constructor(config: AtlassianConfig) {
    this.logger = new Logger('JiraService');
    this.config = config;
  }

  /**
   * Lấy danh sách dự án
   */
  async getProjects(): Promise<JiraProject[]> {
    this.logger.info('Fetching Jira projects');
    const response = await callJiraApi(this.config, '/rest/api/3/project', 'GET');
    return response as JiraProject[];
  }

  /**
   * Lấy thông tin dự án theo key
   * @param projectKey Key của dự án
   */
  async getProject(projectKey: string): Promise<JiraProject> {
    this.logger.info(`Fetching Jira project: ${projectKey}`);
    const response = await callJiraApi(this.config, `/rest/api/3/project/${projectKey}`, 'GET');
    return response as JiraProject;
  }

  /**
   * Tìm kiếm issue theo JQL
   * @param params Tham số tìm kiếm
   */
  async searchIssues(params: JiraSearchParams): Promise<JiraSearchResult> {
    this.logger.info(`Searching Jira issues with JQL: ${params.jql}`);
    const response = await callJiraApi(this.config, '/rest/api/3/search', 'POST', params);
    return response as JiraSearchResult;
  }

  /**
   * Lấy thông tin issue theo ID
   * @param issueIdOrKey ID hoặc key của issue
   * @param fields Các trường cần lấy
   */
  async getIssue(issueIdOrKey: string, fields?: string[]): Promise<JiraIssue> {
    this.logger.info(`Fetching Jira issue: ${issueIdOrKey}`);
    let url = `/rest/api/3/issue/${issueIdOrKey}`;
    
    if (fields && fields.length > 0) {
      url += `?fields=${fields.join(',')}`;
    }
    
    const response = await callJiraApi(this.config, url, 'GET');
    return response as JiraIssue;
  }

  /**
   * Tạo issue mới
   * @param params Tham số tạo issue
   */
  async createIssue(params: JiraCreateIssueParams): Promise<{ id: string; key: string; self: string }> {
    this.logger.info(`Creating Jira issue: ${params.fields.summary}`);
    const response = await callJiraApi(this.config, '/rest/api/3/issue', 'POST', params);
    return response as { id: string; key: string; self: string };
  }

  /**
   * Cập nhật issue
   * @param issueIdOrKey ID hoặc key của issue
   * @param data Dữ liệu cập nhật
   */
  async updateIssue(issueIdOrKey: string, data: any): Promise<void> {
    this.logger.info(`Updating Jira issue: ${issueIdOrKey}`);
    await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}`, 'PUT', data);
  }

  /**
   * Lấy danh sách trạng thái chuyển đổi cho issue
   * @param issueIdOrKey ID hoặc key của issue
   */
  async getTransitions(issueIdOrKey: string): Promise<JiraTransitionsResult> {
    this.logger.info(`Fetching transitions for issue: ${issueIdOrKey}`);
    const response = await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}/transitions`, 'GET');
    return response as JiraTransitionsResult;
  }

  /**
   * Chuyển đổi trạng thái của issue
   * @param issueIdOrKey ID hoặc key của issue
   * @param transitionId ID của trạng thái chuyển đổi
   * @param fields Các trường cập nhật khi chuyển đổi
   * @param comment Bình luận khi chuyển đổi
   */
  async transitionIssue(
    issueIdOrKey: string, 
    transitionId: string, 
    fields?: any, 
    comment?: string
  ): Promise<void> {
    this.logger.info(`Transitioning issue ${issueIdOrKey} to transition ${transitionId}`);
    
    const data: any = {
      transition: { id: transitionId }
    };
    
    if (fields) {
      data.fields = fields;
    }
    
    if (comment) {
      data.update = {
        comment: [
          {
            add: {
              body: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: comment }]
                  }
                ]
              }
            }
          }
        ]
      };
    }
    
    await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}/transitions`, 'POST', data);
  }

  /**
   * Thêm bình luận vào issue
   * @param issueIdOrKey ID hoặc key của issue
   * @param body Nội dung bình luận
   */
  async addComment(issueIdOrKey: string, body: string): Promise<JiraComment> {
    this.logger.info(`Adding comment to issue: ${issueIdOrKey}`);
    
    const data = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: body }]
          }
        ]
      }
    };
    
    const response = await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}/comment`, 'POST', data);
    return response as JiraComment;
  }

  /**
   * Xóa issue
   * @param issueIdOrKey ID hoặc key của issue
   */
  async deleteIssue(issueIdOrKey: string): Promise<void> {
    this.logger.info(`Deleting issue: ${issueIdOrKey}`);
    await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}`, 'DELETE');
  }
  
  /**
   * Gán issue cho người dùng
   * @param issueIdOrKey ID hoặc key của issue
   * @param accountId ID tài khoản người dùng
   */
  async assignIssue(issueIdOrKey: string, accountId: string): Promise<void> {
    this.logger.info(`Assigning issue ${issueIdOrKey} to user ${accountId}`);
    await callJiraApi(this.config, `/rest/api/3/issue/${issueIdOrKey}/assignee`, 'PUT', { accountId });
  }
} 