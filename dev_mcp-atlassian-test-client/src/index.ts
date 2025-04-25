import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc biến môi trường từ .env
function loadEnv(): Record<string, string> {
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      // Bỏ qua comment và dòng trống
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('='); // Phòng trường hợp value có dấu =
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error("Error loading .env file:", error);
    return {};
  }
}

async function main() {
  try {
    const envVars = loadEnv();
    
    // Khởi tạo client
    const client = new Client({ 
      name: "mcp-atlassian-test-client", 
      version: "1.0.0" 
    });

    // Đường dẫn đến MCP server của bạn
    const serverPath = "/Users/phucnt/Workspace/dev_assist_agent/dev_mcp-server-atlassian/dist/index.js";

    // Khởi tạo transport với biến môi trường
    const processEnv: Record<string, string> = {};
    // Chuyển đổi process.env thành record với kiểu string
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
      }
    });
    
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
      env: {
        ...processEnv,
        ...envVars
      }
    });

    // Kết nối đến server
    console.log("Connecting to MCP server...");
    await client.connect(transport);

    // Liệt kê các tools có sẵn
    console.log("Listing available tools...");
    const toolsResult = await client.listTools();
    console.log("Available tools:", toolsResult.tools.map(tool => tool.name));

    // Test getIssue từ Jira
    console.log("\n=== Testing Jira getIssue ===");
    const jiraResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueIdOrKey: "DEMO-1" // Thay đổi thành một ID issue thực tế trong hệ thống của bạn
      }
    });
    console.log("Jira Get Issue Result:");
    console.log(JSON.stringify(jiraResult, null, 2));

    // Test getSpaces từ Confluence
    console.log("\n=== Testing Confluence getSpaces ===");
    const confluenceResult = await client.callTool({
      name: "getSpaces",
      arguments: {}
    });
    console.log("Confluence Get Spaces Result:");
    console.log(JSON.stringify(confluenceResult, null, 2));

    // Đóng kết nối
    console.log("\nClosing connection...");
    await client.close();
    console.log("Connection closed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 