# Hướng Dẫn Đầy Đủ Phát Triển MCP Server Tương Tác Với Jira và Confluence

Bài hướng dẫn này sẽ giúp bạn xây dựng một MCP Server từ đầu để kết nối với Atlassian Jira và Confluence, sử dụng Node.js và TypeScript.

## Giới Thiệu Về MCP

Model Context Protocol (MCP) là một chuẩn mở cho phép các hệ thống AI kết nối an toàn và theo ngữ cảnh với các công cụ và nguồn dữ liệu bên ngoài. Trong trường hợp này, chúng ta sẽ tạo một server MCP làm cầu nối giữa trợ lý AI (như Claude, Cursor AI) và hệ thống Jira/Confluence của bạn.

## Chuẩn Bị

### Yêu Cầu Hệ Thống

- Node.js (phiên bản 18.x trở lên, khuyến nghị v22.14.0+)
- Tài khoản Atlassian với quyền truy cập vào Jira và Confluence
- Kiến thức cơ bản về TypeScript
- Visual Studio Code hoặc IDE tương tự

### Cài Đặt Môi Trường

```bash
# Tạo thư mục dự án
mkdir mcp-atlassian-server
cd mcp-atlassian-server

# Khởi tạo dự án Node.js
npm init -y

# Cài đặt các dependencies cần thiết
npm install @modelcontextprotocol/sdk zod dotenv
npm install -D typescript @types/node ts-node
```

## Bước 1: Lấy API Token Atlassian

1. Truy cập trang quản lý token API Atlassian: https://id.atlassian.com/manage-profile/security/api-tokens
2. Nhấp vào "Create API token"
3. Đặt tên mô tả cho token (ví dụ: "mcp-atlassian-access")
4. Nhấp "Create"
5. Sao chép token được tạo ngay lập tức (bạn sẽ không thể xem lại nó sau này)

## Bước 2: Cấu Hình TypeScript

Tạo file `tsconfig.json` với nội dung:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Bước 3: Cấu Hình Biến Môi Trường

Tạo file `.env` trong thư mục gốc dự án:

```
ATLASSIAN_SITE_NAME=your-site-name
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

Thay thế:
- `your-site-name` với tên site Jira của bạn (ví dụ: `mycompany` cho `mycompany.atlassian.net`)
- `your-email@example.com` với email tài khoản Atlassian của bạn
- `your-api-token` với token API bạn đã tạo ở Bước 1

## Bước 4: Tạo Cấu Trúc Dự Án

```bash
mkdir -p src/tools/jira src/tools/confluence src/utils
```

## Bước 5: Tạo File Utility

Tạo file `src/utils/atlassian-api.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

const SITE_NAME = process.env.ATLASSIAN_SITE_NAME;
const EMAIL = process.env.ATLASSIAN_USER_EMAIL;
const API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

if (!SITE_NAME || !EMAIL || !API_TOKEN) {
  throw new Error('Missing Atlassian credentials in environment variables');
}

// Base URL cho Jira và Confluence API
export const JIRA_BASE_URL = `https://${SITE_NAME}.atlassian.net/rest/api/3`;
export const CONFLUENCE_BASE_URL = `https://${SITE_NAME}.atlassian.net/wiki/rest/api`;

// Headers cơ bản cho tất cả requests
export const getBasicHeaders = () => {
  const auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

// Hàm helper để gọi Jira API
export async function callJiraApi(endpoint: string, method = 'GET', body?: any) {
  const url = `${JIRA_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getBasicHeaders(),
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

// Hàm helper để gọi Confluence API
export async function callConfluenceApi(endpoint: string, method = 'GET', body?: any) {
  const url = `${CONFLUENCE_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getBasicHeaders(),
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Confluence API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

// Hàm chuyển đổi Atlassian Document Format sang Markdown đơn giản
export function adfToMarkdown(content: any): string {
  if (!content || !content.content) return '';
  
  let markdown = '';
  
  const processNode = (node: any): string => {
    if (!node) return '';
    
    switch (node.type) {
      case 'paragraph':
        return node.content ? node.content.map(processNode).join('') + '\n\n' : '\n\n';
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'strong':
                text = `**${text}**`;
                break;
              case 'em':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'link':
                text = `[${text}](${mark.attrs.href})`;
                break;
            }
          });
        }
        return text;
      case 'heading':
        const level = node.attrs.level;
        const headingContent = node.content ? node.content.map(processNode).join('') : '';
        return '#'.repeat(level) + ' ' + headingContent + '\n\n';
      case 'bulletList':
        return node.content ? node.content.map(processNode).join('') : '';
      case 'listItem':
        return '- ' + (node.content ? node.content.map(processNode).join('') : '') + '\n';
      case 'orderedList':
        return node.content ? node.content.map((item: any, index: number) => {
          return `${index + 1}. ${processNode(item)}`;
        }).join('') : '';
      case 'codeBlock':
        const code = node.content ? node.content.map(processNode).join('') : '';
        const language = node.attrs && node.attrs.language ? node.attrs.language : '';
        return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      default:
        return node.content ? node.content.map(processNode).join('') : '';
    }
  };
  
  content.content.forEach((node: any) => {
    markdown += processNode(node);
  });
  
  return markdown;
}
```

## Bước 6: Tạo Các Tools Cho Jira

Tạo file `src/tools/jira/issues.ts`:

```typescript
import { z } from 'zod';
import { callJiraApi, adfToMarkdown } from '../../utils/atlassian-api.js';

// Schema cho tham số đầu vào
export const getIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue (ví dụ: PROJ-123)'),
});

export const searchIssuesSchema = z.object({
  jql: z.string().describe('JQL query để tìm kiếm issues (ví dụ: project = PROJ AND status = "In Progress")'),
  maxResults: z.number().optional().default(10).describe('Số lượng kết quả tối đa'),
});

export const createIssueSchema = z.object({
  projectKey: z.string().describe('Key của project'),
  summary: z.string().describe('Tiêu đề của issue'),
  description: z.string().optional().describe('Mô tả của issue'),
  issueType: z.string().default('Task').describe('Loại issue (ví dụ: Bug, Task, Story)'),
});

// Hàm lấy thông tin chi tiết về một issue
export async function getIssue(params: z.infer) {
  try {
    const { issueIdOrKey } = params;
    const issue = await callJiraApi(`/issue/${issueIdOrKey}?expand=renderedFields,names`);
    
    // Chuyển đổi mô tả từ ADF sang Markdown
    let description = '';
    if (issue.fields.description) {
      description = adfToMarkdown(issue.fields.description);
    }
    
    // Định dạng kết quả
    const result = `
# ${issue.fields.summary}

**Key**: ${issue.key}
**Type**: ${issue.fields.issuetype.name}
**Status**: ${issue.fields.status.name}
**Priority**: ${issue.fields.priority?.name || 'Not set'}
**Assignee**: ${issue.fields.assignee?.displayName || 'Unassigned'}
**Reporter**: ${issue.fields.reporter?.displayName || 'Unknown'}
**Created**: ${new Date(issue.fields.created).toLocaleString()}
**Updated**: ${new Date(issue.fields.updated).toLocaleString()}

## Description
${description || 'No description provided.'}
`;
    
    return {
      content: [{ type: 'text', text: result }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error fetching issue: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

// Hàm tìm kiếm issues theo JQL
export async function searchIssues(params: z.infer) {
  try {
    const { jql, maxResults } = params;
    const searchResult = await callJiraApi(`/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
    
    if (searchResult.issues.length === 0) {
      return {
        content: [{ type: 'text', text: 'No issues found matching your query.' }]
      };
    }
    
    let result = `# Found ${searchResult.issues.length} issues\n\n`;
    
    searchResult.issues.forEach((issue: any) => {
      result += `- [${issue.key}] ${issue.fields.summary} (${issue.fields.status.name})\n`;
    });
    
    return {
      content: [{ type: 'text', text: result }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error searching issues: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

// Hàm tạo issue mới
export async function createIssue(params: z.infer) {
  try {
    const { projectKey, summary, description, issueType } = params;
    
    // Chuẩn bị dữ liệu cho request
    const data = {
      fields: {
        project: {
          key: projectKey
        },
        summary: summary,
        issuetype: {
          name: issueType
        }
      }
    };
    
    // Thêm mô tả nếu có
    if (description) {
      data.fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: description
              }
            ]
          }
        ]
      };
    }
    
    const newIssue = await callJiraApi('/issue', 'POST', data);
    
    return {
      content: [{ 
        type: 'text', 
        text: `Issue created successfully!\n\nKey: ${newIssue.key}\nURL: https://${process.env.ATLASSIAN_SITE_NAME}.atlassian.net/browse/${newIssue.key}` 
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error creating issue: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}
```

## Bước 7: Tạo Các Tools Cho Confluence

Tạo file `src/tools/confluence/pages.ts`:

```typescript
import { z } from 'zod';
import { callConfluenceApi, adfToMarkdown } from '../../utils/atlassian-api.js';

// Schema cho tham số đầu vào
export const getPageSchema = z.object({
  pageId: z.string().describe('ID của trang Confluence'),
});

export const searchPagesSchema = z.object({
  query: z.string().describe('Từ khóa tìm kiếm'),
  spaceKey: z.string().optional().describe('Key của space (tùy chọn)'),
  limit: z.number().optional().default(10).describe('Số lượng kết quả tối đa'),
});

export const createPageSchema = z.object({
  spaceKey: z.string().describe('Key của space'),
  title: z.string().describe('Tiêu đề của trang'),
  content: z.string().describe('Nội dung của trang (Markdown)'),
  parentId: z.string().optional().describe('ID của trang cha (tùy chọn)'),
});

// Hàm lấy thông tin chi tiết về một trang
export async function getPage(params: z.infer) {
  try {
    const { pageId } = params;
    const page = await callConfluenceApi(`/content/${pageId}?expand=body.storage,version,space`);
    
    // Lấy nội dung trang
    const content = page.body.storage.value;
    
    // Định dạng kết quả
    const result = `
# ${page.title}

**Space**: ${page.space.name}
**Created by**: ${page.history?.createdBy?.displayName || 'Unknown'}
**Last updated**: ${new Date(page.version.when).toLocaleString()}
**Version**: ${page.version.number}

## Content
${content}
`;
    
    return {
      content: [{ type: 'text', text: result }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error fetching page: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

// Hàm tìm kiếm trang Confluence
export async function searchPages(params: z.infer) {
  try {
    const { query, spaceKey, limit } = params;
    
    let cql = `text ~ "${query}"`;
    if (spaceKey) {
      cql += ` AND space = "${spaceKey}"`;
    }
    
    const searchResult = await callConfluenceApi(`/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}`);
    
    if (searchResult.results.length === 0) {
      return {
        content: [{ type: 'text', text: 'No pages found matching your query.' }]
      };
    }
    
    let result = `# Found ${searchResult.results.length} pages\n\n`;
    
    searchResult.results.forEach((page: any) => {
      result += `- [${page.title}](https://${process.env.ATLASSIAN_SITE_NAME}.atlassian.net/wiki/spaces/${page.space.key}/pages/${page.id})\n`;
    });
    
    return {
      content: [{ type: 'text', text: result }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error searching pages: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

// Hàm tạo trang mới trong Confluence
export async function createPage(params: z.infer) {
  try {
    const { spaceKey, title, content, parentId } = params;
    
    // Chuẩn bị dữ liệu cho request
    const data: any = {
      type: 'page',
      title: title,
      space: {
        key: spaceKey
      },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    // Thêm trang cha nếu có
    if (parentId) {
      data.ancestors = [{ id: parentId }];
    }
    
    const newPage = await callConfluenceApi('/content', 'POST', data);
    
    return {
      content: [{ 
        type: 'text', 
        text: `Page created successfully!\n\nTitle: ${newPage.title}\nURL: https://${process.env.ATLASSIAN_SITE_NAME}.atlassian.net/wiki/spaces/${spaceKey}/pages/${newPage.id}` 
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error creating page: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}
```

## Bước 8: Tạo Main Server File

Tạo file `src/index.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

// Import các tools
import { 
  getIssue, searchIssues, createIssue,
  getIssueSchema, searchIssuesSchema, createIssueSchema 
} from './tools/jira/issues.js';

import {
  getPage, searchPages, createPage,
  getPageSchema, searchPagesSchema, createPageSchema
} from './tools/confluence/pages.js';

// Tải biến môi trường
dotenv.config();

// Khởi tạo MCP server
const server = new McpServer({
  name: 'mcp-atlassian-integration',
  version: '1.0.0'
});

// Đăng ký các tools cho Jira
server.tool('jira.getIssue', getIssueSchema, getIssue);
server.tool('jira.searchIssues', searchIssuesSchema, searchIssues);
server.tool('jira.createIssue', createIssueSchema, createIssue);

// Đăng ký các tools cho Confluence
server.tool('confluence.getPage', getPageSchema, getPage);
server.tool('confluence.searchPages', searchPagesSchema, searchPages);
server.tool('confluence.createPage', createPageSchema, createPage);

// Khởi động server với STDIO transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.error('MCP Atlassian Server started successfully'))
  .catch(error => console.error('Failed to start MCP Server:', error));
```

## Bước 9: Cập Nhật Package.json

Thêm các scripts vào file `package.json`:

```json
{
  "name": "mcp-atlassian-server",
  "version": "1.0.0",
  "description": "MCP Server for Atlassian Jira and Confluence",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node --esm src/index.ts"
  },
  "keywords": ["mcp", "atlassian", "jira", "confluence"],
  "author": "",
  "license": "MIT"
}
```

## Bước 10: Build và Chạy Server

```bash
# Build TypeScript thành JavaScript
npm run build

# Chạy server
npm start
```

## Bước 11: Tạo Dockerfile

Tạo file `Dockerfile` trong thư mục gốc dự án:

```dockerfile
FROM node:lts-slim

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./
RUN npm ci

# Sao chép mã nguồn đã build
COPY dist ./dist

# Lệnh khởi động server
CMD ["node", "dist/index.js"]
```

## Bước 12: Tích Hợp Với Cursor/Claude

### Với Cursor

1. Mở Cursor Settings
2. Điều hướng đến Features > MCP Servers
3. Nhấp "+ Add new global MCP server"
4. Thêm cấu hình:

```json
"mcpServers": {
  "mcp-atlassian": {
    "command": "node",
    "args": ["/đường/dẫn/đầy/đủ/đến/dist/index.js"],
    "env": {
      "ATLASSIAN_SITE_NAME": "your-site-name",
      "ATLASSIAN_USER_EMAIL": "your-email@example.com",
      "ATLASSIAN_API_TOKEN": "your-api-token"
    }
  }
}
```

### Với Claude Desktop

1. Mở Settings
2. Điều hướng đến MCP Servers
3. Nhấp "Add Server"
4. Thêm cấu hình tương tự như trên

## Bước 13: Kiểm Tra Server

Sau khi cấu hình, bạn có thể kiểm tra server bằng cách yêu cầu trợ lý AI thực hiện các tác vụ như:

- "Tìm kiếm các issues có trạng thái 'In Progress' trong dự án XYZ"
- "Lấy thông tin chi tiết về issue ABC-123"
- "Tìm kiếm các trang Confluence có chứa từ khóa 'documentation'"
- "Tạo một issue mới trong dự án XYZ với tiêu đề 'Fix login bug'"

## Mở Rộng

Bạn có thể mở rộng MCP server này bằng cách thêm các chức năng mới như:
- Quản lý sprint và board trong Jira
- Xử lý comments và attachments
- Quản lý người dùng và nhóm
- Tích hợp với các ứng dụng Atlassian khác

Với hướng dẫn này, bạn đã có một MCP server đầy đủ chức năng để tương tác với Jira và Confluence thông qua các trợ lý AI hỗ trợ MCP.