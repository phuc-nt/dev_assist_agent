import { describe, it, expect } from '@jest/globals';
import { 
  createIssue, 
  updateIssueStatus, 
  fetchProjects, 
  searchIssues, 
  getIssue,
  addComment
} from '../services/jira';
import { 
  createPage, 
  getSpaces, 
  getPages, 
  getPageContent, 
  updatePage,
  searchContent
} from '../services/confluence';

// Bỏ qua test trong môi trường CI/CD
const shouldRunTests = process.env.RUN_REAL_TESTS === 'true';

describe('Real Atlassian Integration Tests', () => {
  // Bỏ qua tất cả các test nếu không được cấu hình chạy thực tế
  if (!shouldRunTests) {
    it('Skipped real tests (set RUN_REAL_TESTS=true to enable)', () => {
      console.log('Real Atlassian tests skipped. Set RUN_REAL_TESTS=true to enable.');
    });
    return;
  }

  // Sử dụng biến chung để lưu dữ liệu giữa các test
  const testData = {
    jira: {
      projectKey: 'XDEMO2',
      issueKey: '',
      issueId: ''
    },
    confluence: {
      spaceKey: 'TX',
      pageId: '',
      pageVersion: 0
    }
  };

  describe('JIRA Services', () => {
    it('1. Should fetch JIRA projects', async () => {
      const result = await fetchProjects();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.projects)).toBe(true);
      
      const projects = result.data?.projects || [];
      expect(projects.length).toBeGreaterThan(0);
      
      // Tìm dự án được sử dụng trong các test tiếp theo
      const targetProject = projects.find(p => p.key === testData.jira.projectKey);
      expect(targetProject).toBeDefined();
      
      console.log('\n======= JIRA PROJECTS FETCHED =======');
      console.log(`Found ${projects.length} projects`);
      console.log(`Project ${testData.jira.projectKey} found: ${targetProject ? 'Yes' : 'No'}`);
      console.log('==================================\n');
    }, 15000);
    
    it('2. Should create a real JIRA issue', async () => {
      // Tạo issue mới với tiêu đề và mô tả
      const summary = `MCP Server Test - Real Issue ${new Date().toISOString()}`;
      const description = 'This is a test issue created by automated test for MCP Server';
      const issueType = 'Task'; // Loại issue là Task
      
      // Tạo issue mới
      const createResult = await createIssue(
        summary,
        description,
        issueType, 
        testData.jira.projectKey
      );
      
      // Kiểm tra kết quả tạo issue
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.data?.key).toContain(testData.jira.projectKey);
      
      // Lưu key để sử dụng trong các test tiếp theo
      testData.jira.issueKey = createResult.data?.key || '';
      testData.jira.issueId = createResult.data?.id || '';
      
      // In thông tin issue đã tạo
      const issueUrl = createResult.data?.url || '';
      console.log('\n======= JIRA TASK CREATED =======');
      console.log(`Task Title: ${summary}`);
      console.log(`Task Key: ${testData.jira.issueKey}`);
      console.log(`Task URL: ${issueUrl}`);
      console.log('================================\n');
    }, 20000);
    
    it('3. Should get JIRA issue details', async () => {
      // Kiểm tra rằng issueKey đã được thiết lập từ test trước
      expect(testData.jira.issueKey).not.toBe('');
      
      // Lấy thông tin chi tiết vấn đề
      const result = await getIssue(testData.jira.issueKey);
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.key).toBe(testData.jira.issueKey);
      
      console.log('\n======= JIRA TASK DETAILS =======');
      console.log(`Task Key: ${result.data?.key}`);
      console.log(`Task Summary: ${result.data?.summary}`);
      console.log(`Task Status: ${result.data?.status}`);
      console.log('================================\n');
    }, 15000);
    
    it('4. Should update a JIRA issue status', async () => {
      // Kiểm tra rằng issueKey đã được thiết lập từ test trước
      expect(testData.jira.issueKey).not.toBe('');
      
      // Cập nhật trạng thái issue sang "In Progress"
      const newStatus = 'In Progress';
      const updateResult = await updateIssueStatus(testData.jira.issueKey, newStatus);
      
      // Kiểm tra kết quả cập nhật issue
      expect(updateResult.success).toBe(true);
      expect(updateResult.data).toBeDefined();
      expect(updateResult.data?.status).toBe(newStatus);
      
      // In thông tin issue đã cập nhật
      console.log('\n======= JIRA TASK UPDATED =======');
      console.log(`Task Status Updated to: ${newStatus}`);
      console.log(`Task Key: ${testData.jira.issueKey}`);
      console.log('=================================\n');
    }, 20000);
    
    it('5. Should add comment to a JIRA issue', async () => {
      // Kiểm tra rằng issueKey đã được thiết lập từ test trước
      expect(testData.jira.issueKey).not.toBe('');
      
      // Thêm bình luận vào issue
      const commentText = `Automated test comment at ${new Date().toISOString()}`;
      const result = await addComment(testData.jira.issueKey, commentText);
      
      // Kiểm tra kết quả thêm bình luận
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
      
      // In thông tin bình luận đã thêm
      console.log('\n======= JIRA COMMENT ADDED =======');
      console.log(`Comment ID: ${result.data?.id}`);
      console.log(`Comment Text: ${commentText}`);
      console.log(`Task Key: ${testData.jira.issueKey}`);
      console.log('=================================\n');
    }, 15000);
    
    it('6. Should search JIRA issues with JQL', async () => {
      // Tìm kiếm issue đã tạo
      const jql = `key = ${testData.jira.issueKey}`;
      const result = await searchIssues(jql);
      
      // Kiểm tra kết quả tìm kiếm
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.total).toBe(1);
      expect(result.data?.issues.length).toBe(1);
      expect(result.data?.issues[0].key).toBe(testData.jira.issueKey);
      
      // In thông tin tìm kiếm
      console.log('\n======= JIRA SEARCH RESULTS =======');
      console.log(`Found ${result.data?.total} issues`);
      console.log(`JQL Query: ${jql}`);
      console.log('===================================\n');
    }, 15000);
  });
  
  describe('Confluence Services', () => {
    it('1. Should fetch Confluence spaces', async () => {
      const result = await getSpaces();
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.spaces).toBeDefined();
      expect(Array.isArray(result.data?.spaces)).toBe(true);
      
      const spaces = result.data?.spaces || [];
      expect(spaces.length).toBeGreaterThan(0);
      
      // Tìm không gian được sử dụng trong các test tiếp theo
      const targetSpace = spaces.find(s => s.key === testData.confluence.spaceKey);
      expect(targetSpace).toBeDefined();
      
      console.log('\n======= CONFLUENCE SPACES FETCHED =======');
      console.log(`Found ${spaces.length} spaces`);
      console.log(`Space ${testData.confluence.spaceKey} found: ${targetSpace ? 'Yes' : 'No'}`);
      console.log('=======================================\n');
    }, 15000);
    
    it('2. Should create a real Confluence page', async () => {
      // Tạo nội dung trang với timestamp để unique
      const timestamp = new Date().toISOString();
      const title = `MCP Server Test - Real Confluence Page ${timestamp}`;
      const content = `
        <h1>MCP Server Test Page</h1>
        <p>This is a test page created by automated test for MCP Server at ${timestamp}</p>
        <h2>Test Information</h2>
        <ul>
          <li>Test ran at: ${new Date().toLocaleString()}</li>
          <li>Environment: Test environment</li>
          <li>Created by: Automated test</li>
        </ul>
      `;
      
      // Tạo trang mới trong Confluence
      const result = await createPage(title, content, testData.confluence.spaceKey);
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe(title);
      expect(result.data?.spaceKey).toBe(testData.confluence.spaceKey);
      
      // Lưu ID trang để sử dụng trong các test tiếp theo
      testData.confluence.pageId = result.data?.id || '';
      testData.confluence.pageVersion = result.data?.version || 1;
      
      // In thông tin trang đã tạo
      console.log('\n======= CONFLUENCE PAGE CREATED =======');
      console.log(`Page Title: ${title}`);
      console.log(`Page ID: ${testData.confluence.pageId}`);
      console.log(`Page URL: ${result.data?.url}`);
      console.log('======================================\n');
    }, 20000);
    
    it('3. Should get Confluence pages in a space', async () => {
      const result = await getPages(testData.confluence.spaceKey);
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.pages)).toBe(true);
      
      const pages = result.data?.pages || [];
      expect(pages.length).toBeGreaterThan(0);
      
      // Tìm trang đã tạo trong test trước
      const createdPage = pages.find(p => p.id === testData.confluence.pageId);
      
      console.log('\n======= CONFLUENCE PAGES FETCHED =======');
      console.log(`Found ${pages.length} pages in space ${testData.confluence.spaceKey}`);
      console.log(`Created page found: ${createdPage ? 'Yes' : 'No'}`);
      console.log('========================================\n');
    }, 15000);
    
    it('4. Should get Confluence page content', async () => {
      // Kiểm tra rằng pageId đã được thiết lập từ test trước
      expect(testData.confluence.pageId).not.toBe('');
      
      // Lấy nội dung trang
      const result = await getPageContent(testData.confluence.pageId);
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(testData.confluence.pageId);
      expect(result.data?.content).toBeDefined();
      
      // Lưu version mới nhất
      testData.confluence.pageVersion = result.data?.version || 1;
      
      console.log('\n======= CONFLUENCE PAGE CONTENT =======');
      console.log(`Page Title: ${result.data?.title}`);
      console.log(`Page Version: ${result.data?.version}`);
      console.log(`Content Length: ${result.data?.content?.length || 0} characters`);
      console.log('======================================\n');
    }, 15000);
    
    // Kích hoạt lại test cập nhật trang, đã sửa phần xử lý version
    it('5. Should update Confluence page content', async () => {
      // Kiểm tra rằng pageId đã được thiết lập từ test trước
      expect(testData.confluence.pageId).not.toBe('');
      
      // Lấy thông tin trang hiện tại để có nội dung ban đầu
      const pageInfo = await getPageContent(testData.confluence.pageId);
      expect(pageInfo.success).toBe(true);
      
      // Tạo nội dung mới
      const updatedTitle = `${pageInfo.data?.title} (Updated)`;
      const timestamp = new Date().toISOString();
      const updatedContent = `
        <h1>Updated MCP Server Test Page</h1>
        <p>This page was updated by automated test at ${timestamp}</p>
        <h2>Original Content</h2>
        ${pageInfo.data?.content || ''}
        <h2>Update Information</h2>
        <ul>
          <li>Updated at: ${new Date().toLocaleString()}</li>
          <li>Updated by: Automated test</li>
        </ul>
      `;
      
      // Version sẽ được xác định tự động trong hàm updatePage
      const result = await updatePage(
        testData.confluence.pageId,
        updatedTitle,
        updatedContent
      );
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe(updatedTitle);
      
      // Cập nhật version mới
      testData.confluence.pageVersion = result.data?.version || 0;
      
      console.log('\n======= CONFLUENCE PAGE UPDATED =======');
      console.log(`Page Title: ${result.data?.title}`);
      console.log(`New Version: ${result.data?.version}`);
      console.log(`Page URL: ${result.data?.url}`);
      console.log('======================================\n');
    }, 20000);
    
    it('6. Should search Confluence content', async () => {
      // Tìm kiếm dựa trên tiêu đề trang
      const searchTerm = "MCP Server Test";
      const result = await searchContent(searchTerm, testData.confluence.spaceKey);
      
      // Kiểm tra kết quả
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.results)).toBe(true);
      
      const searchResults = result.data?.results || [];
      // Tìm trang đã tạo trong kết quả tìm kiếm (có thể cần thời gian để index)
      // Không khẳng định vì có thể cần thời gian để index
      const foundPage = searchResults.find(p => p.id === testData.confluence.pageId);
      
      console.log('\n======= CONFLUENCE SEARCH RESULTS =======');
      console.log(`Search Term: "${searchTerm}"`);
      console.log(`Found ${searchResults.length} results`);
      console.log(`Created page found in search: ${foundPage ? 'Yes' : 'No'}`);
      console.log('=========================================\n');
    }, 15000);
  });
}); 