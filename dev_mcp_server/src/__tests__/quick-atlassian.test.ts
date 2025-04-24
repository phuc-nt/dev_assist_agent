import { describe, it, expect } from '@jest/globals';
import { createIssue, fetchProjects } from '../services/jira';
import { createPage, getSpaces } from '../services/confluence';

// Bỏ qua test trong môi trường CI/CD
const shouldRunTests = process.env.RUN_REAL_TESTS === 'true';

describe('Quick Atlassian API Tests', () => {
  // Bỏ qua tất cả các test nếu không được cấu hình chạy thực tế
  if (!shouldRunTests) {
    it('Skipped quick tests (set RUN_REAL_TESTS=true to enable)', () => {
      console.log('Quick Atlassian tests skipped. Set RUN_REAL_TESTS=true to enable.');
    });
    return;
  }

  // Sử dụng biến chung để lưu dữ liệu giữa các test
  const testData = {
    jira: {
      projectKey: 'XDEMO2',
      issueKey: '',
    },
    confluence: {
      spaceKey: 'TX',
      pageId: '',
    }
  };

  describe('Quick JIRA Test', () => {
    it('should fetch JIRA projects and create an issue', async () => {
      // Bước 1: Lấy danh sách dự án
      const projectResult = await fetchProjects();
      
      expect(projectResult.success).toBe(true);
      expect(projectResult.data).toBeDefined();
      expect(Array.isArray(projectResult.data?.projects)).toBe(true);
      
      const projects = projectResult.data?.projects || [];
      expect(projects.length).toBeGreaterThan(0);
      
      // Tìm dự án được sử dụng trong test
      const targetProject = projects.find(p => p.key === testData.jira.projectKey);
      expect(targetProject).toBeDefined();
      
      console.log(`\n======= JIRA PROJECTS FETCHED =======`);
      console.log(`Found ${projects.length} projects`);
      console.log(`Project ${testData.jira.projectKey} found: ${targetProject ? 'Yes' : 'No'}`);
      
      // Bước 2: Tạo task mới
      const summary = `Quick MCP Server Test - ${new Date().toISOString()}`;
      const description = 'This is a quick test issue created by automated test for MCP Server';
      const issueType = 'Task';
      
      const createResult = await createIssue(
        summary,
        description,
        issueType, 
        testData.jira.projectKey
      );
      
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.data?.key).toContain(testData.jira.projectKey);
      
      testData.jira.issueKey = createResult.data?.key || '';
      
      console.log(`\n======= JIRA TASK CREATED =======`);
      console.log(`Task Title: ${summary}`);
      console.log(`Task Key: ${testData.jira.issueKey}`);
      console.log(`Task URL: ${createResult.data?.url}`);
    }, 25000);
  });
  
  describe('Quick Confluence Test', () => {
    it('should fetch Confluence spaces and create a page', async () => {
      // Bước 1: Lấy danh sách không gian
      const spaceResult = await getSpaces();
      
      expect(spaceResult.success).toBe(true);
      expect(spaceResult.data).toBeDefined();
      expect(spaceResult.data?.spaces).toBeDefined();
      expect(Array.isArray(spaceResult.data?.spaces)).toBe(true);
      
      const spaces = spaceResult.data?.spaces || [];
      expect(spaces.length).toBeGreaterThan(0);
      
      // Tìm không gian được sử dụng trong test
      const targetSpace = spaces.find(s => s.key === testData.confluence.spaceKey);
      expect(targetSpace).toBeDefined();
      
      console.log(`\n======= CONFLUENCE SPACES FETCHED =======`);
      console.log(`Found ${spaces.length} spaces`);
      console.log(`Space ${testData.confluence.spaceKey} found: ${targetSpace ? 'Yes' : 'No'}`);
      
      // Bước 2: Tạo trang mới
      const timestamp = new Date().toISOString();
      const title = `Quick MCP Server Test - ${timestamp}`;
      const content = `
        <h1>Quick MCP Server Test Page</h1>
        <p>This is a quick test page created by automated test at ${timestamp}</p>
        <ul>
          <li>Test ran at: ${new Date().toLocaleString()}</li>
          <li>Environment: Test environment</li>
        </ul>
      `;
      
      const pageResult = await createPage(title, content, testData.confluence.spaceKey);
      
      expect(pageResult.success).toBe(true);
      expect(pageResult.data).toBeDefined();
      expect(pageResult.data?.title).toBe(title);
      expect(pageResult.data?.spaceKey).toBe(testData.confluence.spaceKey);
      
      testData.confluence.pageId = pageResult.data?.id || '';
      
      console.log(`\n======= CONFLUENCE PAGE CREATED =======`);
      console.log(`Page Title: ${title}`);
      console.log(`Page ID: ${testData.confluence.pageId}`);
      console.log(`Page URL: ${pageResult.data?.url}`);
    }, 25000);
  });
}); 