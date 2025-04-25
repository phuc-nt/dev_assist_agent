import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetIssueTool } from './tools/jira/get-issue.js';
import { registerSearchIssuesTool } from './tools/jira/search-issues.js';
import { registerCreateIssueTool } from './tools/jira/create-issue.js';
import { registerUpdateIssueTool } from './tools/jira/update-issue.js';
import { registerTransitionIssueTool } from './tools/jira/transition-issue.js';
import { registerAssignIssueTool } from './tools/jira/assign-issue.js';
import { registerCreatePageTool } from './tools/confluence/create-page.js';
import { registerGetPageTool } from './tools/confluence/get-page.js';
import { registerSearchPagesTool } from './tools/confluence/search-pages.js';
import { registerUpdatePageTool } from './tools/confluence/update-page.js';
import { registerGetSpacesTool } from './tools/confluence/get-spaces.js';
import { registerAddCommentTool } from './tools/confluence/add-comment.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api.js';

// Tải biến môi trường
dotenv.config();

// Khởi tạo logger
const logger = Logger.getLogger('MCP:Server');

// Lấy cấu hình Atlassian từ biến môi trường
const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME;
const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL;
const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
  logger.error('Missing Atlassian credentials in environment variables');
  process.exit(1);
}

const atlassianConfig: AtlassianConfig = {
  baseUrl: `https://${ATLASSIAN_SITE_NAME}.atlassian.net`,
  apiToken: ATLASSIAN_API_TOKEN,
  email: ATLASSIAN_USER_EMAIL
};

// Khởi tạo MCP server
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || 'mcp-atlassian-integration',
  version: process.env.MCP_SERVER_VERSION || '1.0.0'
});

// Thiết lập context cho các tool handlers
const context = new Map<string, any>();
context.set('atlassianConfig', atlassianConfig);

// Đăng ký các tools Jira với hàm xử lý context
registerGetIssueTool(server);
registerSearchIssuesTool(server);
registerCreateIssueTool(server);
registerUpdateIssueTool(server);
registerTransitionIssueTool(server);
registerAssignIssueTool(server);

// Đăng ký các tools Confluence
registerCreatePageTool(server);
registerGetPageTool(server);
registerSearchPagesTool(server);
registerUpdatePageTool(server);
registerGetSpacesTool(server);
registerAddCommentTool(server);

// Log message khi khởi động
logger.info('Initializing MCP Atlassian Server...');

// Khởi động server với STDIO transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => logger.info('MCP Atlassian Server started successfully'))
  .catch(error => logger.error('Failed to start MCP Server:', error));

// In thông tin khởi động
logger.info(`MCP Server Name: ${process.env.MCP_SERVER_NAME || 'mcp-atlassian-integration'}`);
logger.info(`MCP Server Version: ${process.env.MCP_SERVER_VERSION || '1.0.0'}`);
logger.info(`Connected to Atlassian site: ${ATLASSIAN_SITE_NAME}`);
logger.info('Registered tools:');

// Jira tools
logger.info('- getIssue (Jira)');
logger.info('- searchIssues (Jira)');
logger.info('- createIssue (Jira)');
logger.info('- updateIssue (Jira)');
logger.info('- transitionIssue (Jira)');
logger.info('- assignIssue (Jira)');

// Confluence tools
logger.info('- createPage (Confluence)');
logger.info('- getPage (Confluence)');
logger.info('- searchPages (Confluence)');
logger.info('- updatePage (Confluence)');
logger.info('- getSpaces (Confluence)');
logger.info('- addComment (Confluence)'); 