# Xây dựng MCP Server bằng TypeScript

MCP (Model Context Protocol) là một giao thức mở được phát triển bởi Anthropic, cho phép ứng dụng cung cấp ngữ cảnh cho các mô hình ngôn ngữ lớn (LLM) theo cách tiêu chuẩn hóa. Nếu bạn muốn xây dựng một MCP server bằng TypeScript, dưới đây là các thư viện phổ biến và cần thiết.

## Thư viện chính cho MCP

### @modelcontextprotocol/sdk

Đây là thư viện chính thức để xây dựng MCP server bằng TypeScript. Thư viện này triển khai đầy đủ đặc tả MCP, giúp bạn:

- Xây dựng các client MCP có thể kết nối với bất kỳ server MCP nào
- Tạo server MCP để hiển thị tài nguyên, prompt và công cụ
- Sử dụng các phương thức truyền tải tiêu chuẩn như stdio và Streamable HTTP
- Xử lý tất cả các thông điệp và sự kiện vòng đời của giao thức MCP[1]

Cài đặt:
```bash
npm install @modelcontextprotocol/sdk
```

### @modelcontextprotocol/server-core

Một thư viện thay thế để tạo server MCP, cung cấp các API đơn giản hơn cho việc xây dựng server:

```bash
npm install @modelcontextprotocol/server-core
```

Thư viện này cho phép bạn tạo server và xử lý các yêu cầu MCP một cách dễ dàng[8].

## Thư viện hỗ trợ

### zod

Zod là một thư viện xác thực schema TypeScript-first, thường được sử dụng với MCP SDK để xác định schema cho các công cụ và tài nguyên:

```bash
npm install zod
```

Zod giúp bạn định nghĩa cấu trúc dữ liệu đầu vào và đầu ra cho các công cụ MCP của bạn với kiểu dữ liệu TypeScript[2][5].

### TypeScript và các công cụ phát triển

```bash
npm install -D typescript @types/node
```

TypeScript là bắt buộc để phát triển MCP server với kiểu dữ liệu tĩnh, giúp phát hiện lỗi sớm và cải thiện trải nghiệm phát triển[2][7].

### Các thư viện hỗ trợ phát triển

```bash
npm install -D nodemon ts-node concurrently
```

- **nodemon**: Theo dõi thay đổi trong mã nguồn và tự động khởi động lại server
- **ts-node**: Chạy TypeScript trực tiếp mà không cần biên dịch
- **concurrently**: Chạy nhiều lệnh cùng lúc, hữu ích khi phát triển[7]

### dotenv

```bash
npm install dotenv
```

Quản lý biến môi trường trong quá trình phát triển và triển khai[5][7].

## Thư viện tùy chọn

### fastmcp

Một framework TypeScript cho việc xây dựng MCP server có khả năng xử lý các phiên client:

```bash
npm install fastmcp
```

Thư viện này cung cấp các API cao cấp hơn để quản lý phiên và xử lý các kết nối client[11].

### Thư viện tích hợp với dịch vụ cloud

Nếu bạn muốn tích hợp MCP server với các dịch vụ cloud như Azure AI:

```bash
npm install @azure/ai-projects @azure/identity
```

Các thư viện này cho phép bạn kết nối MCP server với các dịch vụ AI trên cloud[5].

===

# Xây dựng MCP Server bằng TypeScript để tương tác với Jira và Confluence của Atlassian

## Thiết lập dự án MCP Server cho Atlassian

### Chuẩn bị môi trường

Phần này thiết lập nền tảng cơ bản cho dự án của bạn, bao gồm cấu trúc thư mục, cài đặt các phụ thuộc cần thiết và cấu hình TypeScript. Đây là bước đầu tiên quan trọng để đảm bảo môi trường phát triển được chuẩn bị đúng cách.

1. Tạo thư mục dự án mới:
```bash
mkdir atlassian-mcp-server
cd atlassian-mcp-server
npm init -y
```

2. Cài đặt các phụ thuộc cần thiết:
```bash
npm install @modelcontextprotocol/sdk zod dotenv
npm install -D typescript @types/node ts-node nodemon
```

3. Tạo file tsconfig.json:
```bash
npx tsc --init
```

4. Cấu hình tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
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

5. Tạo file .env để lưu thông tin xác thực:
```
# Jira Configuration
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token

# Confluence Configuration
CONFLUENCE_URL=https://your-domain.atlassian.net/wiki
CONFLUENCE_USERNAME=your-email@example.com
CONFLUENCE_API_TOKEN=your-api-token

# Server Configuration
PORT=3000
```

### Cấu trúc thư mục

Việc tổ chức mã nguồn theo cấu trúc rõ ràng giúp dự án dễ bảo trì và mở rộng. Cấu trúc này phân tách các thành phần khác nhau của ứng dụng thành các module riêng biệt, mỗi module có một trách nhiệm cụ thể.

```
atlassian-mcp-server/
├── src/
│   ├── config/         # Cấu hình ứng dụng và biến môi trường
│   │   └── env.ts
│   ├── services/       # Các dịch vụ giao tiếp với API Atlassian
│   │   ├── jira.ts
│   │   └── confluence.ts
│   ├── tools/          # Định nghĩa các công cụ MCP
│   │   ├── jira-tools.ts
│   │   └── confluence-tools.ts
│   ├── types/          # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── index.ts
│   └── server.ts       # Điểm khởi đầu của ứng dụng
├── .env                # Biến môi trường
├── package.json
└── tsconfig.json
```

## Triển khai mã nguồn

### 1. Cấu hình môi trường (src/config/env.ts)

Module này đóng vai trò xác thực và truy xuất các biến môi trường một cách an toàn. Bằng cách sử dụng Zod, chúng ta có thể đảm bảo rằng tất cả các biến môi trường cần thiết đều tồn tại và có định dạng chính xác trước khi ứng dụng khởi chạy, giúp phát hiện sớm các lỗi cấu hình.

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Schema xác thực các biến môi trường
const envSchema = z.object({
  JIRA_HOST: z.string().url(),
  JIRA_EMAIL: z.string().email(),
  JIRA_API_TOKEN: z.string().min(1),
  CONFLUENCE_URL: z.string().url(),
  CONFLUENCE_USERNAME: z.string().email(),
  CONFLUENCE_API_TOKEN: z.string().min(1),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
});

try {
  const env = envSchema.parse(process.env);
  export default env;
} catch (error) {
  console.error('Invalid environment variables:', error);
  process.exit(1);
}
```

### 2. Service cho Jira (src/services/jira.ts)

Module này chịu trách nhiệm giao tiếp trực tiếp với Jira REST API. Nó đóng gói logic gọi API và xử lý phản hồi, cung cấp một giao diện đơn giản cho các công cụ MCP sử dụng. Việc tách biệt logic API này giúp dễ dàng bảo trì và mở rộng chức năng trong tương lai.

```typescript
import env from '../config/env';

// Cấu hình cơ bản cho các yêu cầu API Jira
const JIRA_API_BASE = `${env.JIRA_HOST}/rest/api/3`;
const AUTH_HEADER = `Basic ${Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString('base64')}`;

// Lấy danh sách tất cả các dự án trong Jira
export async function fetchProjects() {
  const response = await fetch(`${JIRA_API_BASE}/project`, {
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }
  
  return await response.json();
}

// Tìm kiếm các vấn đề bằng JQL (Jira Query Language)
export async function searchIssues(jql: string) {
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
      fields: ['summary', 'status', 'assignee', 'priority', 'created', 'updated']
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to search issues: ${response.statusText}`);
  }
  
  return await response.json();
}

// Lấy thông tin chi tiết về một vấn đề cụ thể
export async function getIssue(issueIdOrKey: string) {
  const response = await fetch(`${JIRA_API_BASE}/issue/${issueIdOrKey}`, {
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get issue: ${response.statusText}`);
  }
  
  return await response.json();
}

// Tạo một vấn đề mới trong Jira
export async function createIssue(projectKey: string, summary: string, description: string, issueType: string) {
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
  
  return await response.json();
}
```

### 3. Service cho Confluence (src/services/confluence.ts)

Tương tự như module Jira, module này quản lý tất cả các tương tác với Confluence REST API. Nó cung cấp các phương thức để truy vấn và thao tác với không gian, trang và nội dung trong Confluence. Việc tách biệt này giúp mã nguồn rõ ràng và dễ bảo trì.

```typescript
import env from '../config/env';

// Cấu hình cơ bản cho các yêu cầu API Confluence
const CONFLUENCE_API_BASE = `${env.CONFLUENCE_URL}/rest/api`;
const AUTH_HEADER = `Basic ${Buffer.from(`${env.CONFLUENCE_USERNAME}:${env.CONFLUENCE_API_TOKEN}`).toString('base64')}`;

// Lấy danh sách tất cả các không gian trong Confluence
export async function getSpaces() {
  const response = await fetch(`${CONFLUENCE_API_BASE}/space`, {
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch spaces: ${response.statusText}`);
  }
  
  return await response.json();
}

// Lấy danh sách tất cả các trang trong một không gian cụ thể
export async function getPages(spaceKey: string) {
  const response = await fetch(`${CONFLUENCE_API_BASE}/content?spaceKey=${spaceKey}&type=page&expand=version`, {
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.statusText}`);
  }
  
  return await response.json();
}

// Lấy nội dung của một trang cụ thể
export async function getPageContent(pageId: string) {
  const response = await fetch(`${CONFLUENCE_API_BASE}/content/${pageId}?expand=body.storage`, {
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page content: ${response.statusText}`);
  }
  
  return await response.json();
}

// Tạo một trang mới trong Confluence
export async function createPage(spaceKey: string, title: string, content: string, parentId?: string) {
  const body: any = {
    type: 'page',
    title,
    space: { key: spaceKey },
    body: {
      storage: {
        value: content,
        representation: 'storage'
      }
    }
  };
  
  // Nếu có parentId, thêm trang mới như một trang con
  if (parentId) {
    body.ancestors = [{ id: parentId }];
  }
  
  const response = await fetch(`${CONFLUENCE_API_BASE}/content`, {
    method: 'POST',
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create page: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### 4. Công cụ Jira cho MCP (src/tools/jira-tools.ts)

Module này định nghĩa các công cụ MCP cho Jira, là cầu nối giữa MCP Protocol và dịch vụ Jira. Mỗi công cụ đại diện cho một hành động cụ thể mà AI có thể thực hiện với Jira, bao gồm định nghĩa tham số đầu vào và logic xử lý để thực hiện hành động đó.

```typescript
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk';
import * as jiraService from '../services/jira';

// Công cụ liệt kê tất cả các dự án Jira
export const listProjectsTool: Tool = {
  name: 'list_jira_projects',
  description: 'List all accessible Jira projects',
  parameters: z.object({}), // Không cần tham số
  handler: async () => {
    try {
      const projects = await jiraService.fetchProjects();
      // Chuyển đổi dữ liệu thô thành định dạng dễ sử dụng hơn cho AI
      return {
        projects: projects.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          url: `${project.self.split('/rest/api')[0]}/browse/${project.key}`
        }))
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ tìm kiếm các vấn đề bằng JQL
export const searchIssuesByJqlTool: Tool = {
  name: 'search_jira_issues',
  description: 'Search Jira issues using JQL (Jira Query Language)',
  parameters: z.object({
    jql: z.string().describe('JQL query string')
  }),
  handler: async ({ jql }) => {
    try {
      const result = await jiraService.searchIssues(jql);
      return {
        total: result.total,
        issues: result.issues.map((issue: any) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
          priority: issue.fields.priority?.name,
          created: issue.fields.created,
          updated: issue.fields.updated,
          url: `${issue.self.split('/rest/api')[0]}/browse/${issue.key}`
        }))
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ lấy thông tin chi tiết về một vấn đề cụ thể
export const getIssueTool: Tool = {
  name: 'get_jira_issue',
  description: 'Get detailed information about a specific Jira issue',
  parameters: z.object({
    issueIdOrKey: z.string().describe('Issue ID or key (e.g., PROJECT-123)')
  }),
  handler: async ({ issueIdOrKey }) => {
    try {
      const issue = await jiraService.getIssue(issueIdOrKey);
      return {
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
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ tạo một vấn đề mới trong Jira
export const createIssueTool: Tool = {
  name: 'create_jira_issue',
  description: 'Create a new Jira issue',
  parameters: z.object({
    projectKey: z.string().describe('Project key (e.g., PROJECT)'),
    summary: z.string().describe('Issue summary/title'),
    description: z.string().describe('Issue description'),
    issueType: z.string().describe('Issue type (e.g., Bug, Task, Story)')
  }),
  handler: async ({ projectKey, summary, description, issueType }) => {
    try {
      const result = await jiraService.createIssue(projectKey, summary, description, issueType);
      return {
        id: result.id,
        key: result.key,
        self: result.self,
        url: `${result.self.split('/rest/api')[0]}/browse/${result.key}`
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Xuất tất cả các công cụ Jira để sử dụng trong server
export const jiraTools = [
  listProjectsTool,
  searchIssuesByJqlTool,
  getIssueTool,
  createIssueTool
];
```

### 5. Công cụ Confluence cho MCP (src/tools/confluence-tools.ts)

Tương tự như module công cụ Jira, module này định nghĩa các công cụ MCP cho Confluence. Mỗi công cụ cho phép AI tương tác với Confluence theo những cách cụ thể, như liệt kê không gian, xem nội dung trang và tạo trang mới.

```typescript
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk';
import * as confluenceService from '../services/confluence';

// Công cụ liệt kê tất cả các không gian Confluence
export const listSpacesTool: Tool = {
  name: 'list_confluence_spaces',
  description: 'List all accessible Confluence spaces',
  parameters: z.object({}), // Không cần tham số
  handler: async () => {
    try {
      const result = await confluenceService.getSpaces();
      // Chuyển đổi dữ liệu thô thành định dạng dễ sử dụng hơn cho AI
      return {
        spaces: result.results.map((space: any) => ({
          id: space.id,
          key: space.key,
          name: space.name,
          type: space.type,
          url: `${space._links.self.split('/rest/api')[0]}/spaces/${space.key}`
        }))
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ liệt kê tất cả các trang trong một không gian
export const listPagesTool: Tool = {
  name: 'list_confluence_pages',
  description: 'List all pages in a Confluence space',
  parameters: z.object({
    spaceKey: z.string().describe('Space key (e.g., DEV, HR)')
  }),
  handler: async ({ spaceKey }) => {
    try {
      const result = await confluenceService.getPages(spaceKey);
      return {
        pages: result.results.map((page: any) => ({
          id: page.id,
          title: page.title,
          version: page.version.number,
          lastUpdated: page.version.when,
          url: `${page._links.self.split('/rest/api')[0]}${page._links.webui}`
        }))
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ lấy nội dung của một trang cụ thể
export const getPageContentTool: Tool = {
  name: 'get_confluence_page_content',
  description: 'Get the content of a specific Confluence page',
  parameters: z.object({
    pageId: z.string().describe('Page ID')
  }),
  handler: async ({ pageId }) => {
    try {
      const page = await confluenceService.getPageContent(pageId);
      return {
        id: page.id,
        title: page.title,
        spaceKey: page.space.key,
        content: page.body.storage.value, // Nội dung HTML của trang
        version: page.version.number,
        lastUpdated: page.version.when,
        url: `${page._links.self.split('/rest/api')[0]}${page._links.webui}`
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Công cụ tạo một trang mới trong Confluence
export const createPageTool: Tool = {
  name: 'create_confluence_page',
  description: 'Create a new Confluence page',
  parameters: z.object({
    spaceKey: z.string().describe('Space key (e.g., DEV, HR)'),
    title: z.string().describe('Page title'),
    content: z.string().describe('Page content in Confluence storage format'),
    parentId: z.string().optional().describe('Parent page ID (optional)')
  }),
  handler: async ({ spaceKey, title, content, parentId }) => {
    try {
      const result = await confluenceService.createPage(spaceKey, title, content, parentId);
      return {
        id: result.id,
        title: result.title,
        url: `${result._links.self.split('/rest/api')[0]}${result._links.webui}`
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
};

// Xuất tất cả các công cụ Confluence để sử dụng trong server
export const confluenceTools = [
  listSpacesTool,
  listPagesTool,
  getPageContentTool,
  createPageTool
];
```

### 6. Máy chủ MCP (src/server.ts)

Đây là điểm khởi đầu của ứng dụng, nơi tất cả các thành phần được kết hợp lại để tạo thành một MCP server hoàn chỉnh. Module này khởi tạo server, đăng ký các công cụ và tài nguyên, và bắt đầu lắng nghe các kết nối đến.

```typescript
import { createServer } from '@modelcontextprotocol/sdk';
import env from './config/env';
import { jiraTools } from './tools/jira-tools';
import { confluenceTools } from './tools/confluence-tools';

const PORT = env.PORT;

async function startServer() {
  try {
    // Tạo một MCP server với các công cụ và tài nguyên đã định nghĩa
    const server = createServer({
      // Kết hợp tất cả các công cụ từ Jira và Confluence
      tools: [...jiraTools, ...confluenceTools],
      // Định nghĩa các tài nguyên mà server có thể cung cấp
      resources: [
        {
          id: 'jira',
          name: 'Jira',
          description: 'Jira issue tracking system',
          schema: {
            type: 'object',
            properties: {
              projectKey: { type: 'string' }
            }
          }
        },
        {
          id: 'confluence',
          name: 'Confluence',
          description: 'Confluence knowledge base',
          schema: {
            type: 'object',
            properties: {
              spaceKey: { type: 'string' }
            }
          }
        }
      ]
    });

    // Sử dụng HTTP transport để lắng nghe các kết nối
    await server.listen({
      type: 'http',
      port: PORT
    });

    console.log(`MCP Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

startServer();
```

### 7. Cập nhật package.json

File này quản lý các phụ thuộc và script của dự án. Các script được định nghĩa giúp tự động hóa các tác vụ phổ biến như xây dựng, khởi động và phát triển ứng dụng.

```json
"scripts": {
  "build": "tsc",                           // Biên dịch TypeScript thành JavaScript
  "start": "node dist/server.js",           // Chạy phiên bản đã biên dịch
  "dev": "nodemon --exec ts-node src/server.ts", // Chạy trong chế độ phát triển với tự động tải lại
  "lint": "eslint src/**/*.ts"              // Kiểm tra lỗi cú pháp và phong cách code
}
```

## Tổng kết

MCP server mà bạn đã xây dựng cung cấp một giao diện tiêu chuẩn để các mô hình AI như Claude có thể tương tác với Jira và Confluence của Atlassian. Server này hoạt động như một cầu nối, cho phép AI thực hiện các hành động như:

1. **Truy vấn thông tin**: Lấy danh sách dự án, tìm kiếm vấn đề, xem không gian và trang
2. **Thực hiện hành động**: Tạo vấn đề mới trong Jira hoặc trang mới trong Confluence

Kiến trúc module hóa của dự án cho phép dễ dàng mở rộng với các chức năng mới hoặc tích hợp với các dịch vụ Atlassian khác trong tương lai. Bằng cách tuân theo giao thức MCP, server này có thể hoạt động với bất kỳ client MCP nào, không chỉ giới hạn ở Claude.

Để mở rộng dự án này, bạn có thể:
- Thêm hỗ trợ cho các API Jira và Confluence khác (như cập nhật vấn đề, thêm bình luận)
- Tích hợp với các dịch vụ Atlassian khác như Bitbucket hoặc Trello
- Thêm xác thực và phân quyền người dùng
- Triển khai giám sát và ghi nhật ký để theo dõi hiệu suất và sử dụng