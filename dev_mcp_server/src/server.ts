import { 
  createServer, 
  createHTTPTransport,
  HttpTransportServerConfig,
  HttpErrorMessage,
  TransportOnRequest,
  TransportError
} from '@modelcontextprotocol/sdk';
import env from './config/env';
import { jiraTools } from './tools/jira-tools';
import { confluenceTools } from './tools/confluence-tools';

// Cấu hình port cho server
const PORT = env.server.port;

// Khởi tạo MCP Server
const server = createServer({
  id: 'dev-assist-mcp-server',
  name: 'DevAssist MCP Server',
  description: 'MCP Server cho tích hợp JIRA và Confluence trong DevAssist Bot',
  version: '1.0.0',
  tools: {
    ...jiraTools,
    ...confluenceTools
  },
  resources: [
    {
      name: 'jira',
      description: 'Tích hợp với JIRA API',
      auth: {
        type: 'basic',
        description: 'Sử dụng email và API token của JIRA'
      }
    },
    {
      name: 'confluence',
      description: 'Tích hợp với Confluence API',
      auth: {
        type: 'basic',
        description: 'Sử dụng email và API token của Confluence'
      }
    }
  ]
});

// Thiết lập basic auth middleware
const authenticate: TransportOnRequest = (req) => {
  const authHeader = req.headers.authorization;
  
  // Trong môi trường phát triển, có thể bỏ qua xác thực
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  
  // Trong môi trường sản xuất, cần xác thực
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new TransportError({
      code: 401,
      message: 'Unauthorized: Authentication required'
    });
  }
  
  // Thực hiện kiểm tra token (trong triển khai thực tế, sẽ có token an toàn hơn)
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [username, password] = auth.split(':');
  
  // Kiểm tra đơn giản
  if (username !== 'central-agent' || password !== 'secure-password') {
    throw new TransportError({
      code: 401,
      message: 'Unauthorized: Invalid credentials'
    });
  }
};

// Tạo HTTP transport
const httpConfig: HttpTransportServerConfig = {
  port: PORT,
  onRequest: authenticate,
  errorHandler: (err): HttpErrorMessage => {
    console.error('Server error:', err);
    
    // Định dạng phản hồi lỗi
    return {
      code: err.code || 500,
      message: err.message || 'Internal server error',
      data: err.data || {}
    };
  }
};

// Khởi động server
const transport = createHTTPTransport(server, httpConfig);

transport.listen().then(() => {
  console.log(`🚀 MCP Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Tài liệu OpenAPI có sẵn tại http://localhost:${PORT}/docs`);
}).catch(error => {
  console.error('❌ Không thể khởi động MCP Server:', error);
  process.exit(1);
}); 