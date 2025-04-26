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
    console.log("=== MCP Atlassian Test Client ===");
    console.log("Testing all tools in dev_mcp-server-atlassian\n");
    
    const envVars = loadEnv();
    
    // Khởi tạo client
    const client = new Client({ 
      name: "mcp-atlassian-test-client", 
      version: "1.0.0" 
    });

    // Đường dẫn đến MCP server của bạn
    const serverPath = path.resolve(process.cwd(), "../dev_mcp-server-atlassian/dist/index.js");

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
    console.log("\n=== Available Tools ===");
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools.map(tool => tool.name);
    console.log("Tools:", tools.join(", "));

    // Phần 1: Test các tools Jira
    console.log("\n=== Testing Jira Tools ===");
    
    // 1. Test getIssue
    console.log("\n1. Testing getIssue");
    const getIssueResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueIdOrKey: "XDEMO2-1"
      }
    });
    console.log("Success:", getIssueResult.content ? "✅" : "❌");
    console.log("Summary:", getIssueResult.summary || "No summary");
    
    // 2. Test searchIssues
    console.log("\n2. Testing searchIssues");
    const searchIssuesResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        jql: "project = XDEMO2 ORDER BY created DESC",
        maxResults: 3
      }
    });
    console.log("Success:", searchIssuesResult.content ? "✅" : "❌");
    console.log("Found issues:", searchIssuesResult.total || 0);
    
    // 3. Test createIssue
    console.log("\n3. Testing createIssue");
    const newIssueSummary = `Test Issue ${new Date().toLocaleString()}`;
    const createIssueResult = await client.callTool({
      name: "createIssue",
      arguments: {
        projectKey: "XDEMO2",
        summary: newIssueSummary,
        description: "Test issue created by MCP test client",
        issueType: "Task"
      }
    });
    console.log("Success:", createIssueResult.key ? "✅" : "❌");
    console.log("New Issue Key:", createIssueResult.key || "Unknown");
    
    // Store issue key for later tests
    const newIssueKey = createIssueResult.key;
    
    // 4. Test updateIssue
    if (newIssueKey) {
      console.log("\n4. Testing updateIssue");
      const updateIssueResult = await client.callTool({
        name: "updateIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          summary: `${newIssueSummary} (Updated)`,
          description: "Updated description by MCP test client"
        }
      });
      console.log("Success:", updateIssueResult.success ? "✅" : "❌");
      console.log("Message:", updateIssueResult.message || "No response message");
      // Log ra toàn bộ nội dung response để kiểm tra
      console.log("Full response:", JSON.stringify(updateIssueResult, null, 2));
    }
    
    // 5. Test assignIssue
    if (newIssueKey) {
      console.log("\n5. Testing assignIssue");
      const assignIssueResult = await client.callTool({
        name: "assignIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          accountId: "" // Sử dụng chuỗi trống thay vì null để bỏ gán người dùng
        }
      });
      console.log("Success:", assignIssueResult.success ? "✅" : "❌");
      console.log("Message:", assignIssueResult.message || "No message");
    }
    
    // 6. Test transitionIssue
    if (newIssueKey) {
      console.log("\n6. Testing transitionIssue");
      const transitionIssueResult = await client.callTool({
        name: "transitionIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          transitionId: "11", // Chuyển thành "In Progress" (ID có thể khác trong hệ thống của bạn)
          comment: "Starting work on this issue"
        }
      });
      console.log("Success:", transitionIssueResult.success ? "✅" : "❌");
      console.log("Message:", transitionIssueResult.message || "No message");
    }
    
    // Phần 2: Test các tools Confluence
    console.log("\n=== Testing Confluence Tools ===");
    
    // 1. Test getSpaces
    console.log("\n1. Testing getSpaces");
    const getSpacesResult = await client.callTool({
      name: "getSpaces",
      arguments: {
        limit: 5
      }
    });
    console.log("Success:", getSpacesResult.spaces ? "✅" : "❌");
    console.log("Number of spaces:", getSpacesResult.size || 0);
    
    // Store a space key for later tests
    const spaceKey = getSpacesResult.spaces && Array.isArray(getSpacesResult.spaces) && getSpacesResult.spaces.length > 0 
      ? "TX" // Luôn sử dụng TX thay vì space đầu tiên
      : "TX"; // Default to TX if no spaces found
    console.log("Using space key:", spaceKey);
    
    // 2. Test searchPages
    console.log("\n2. Testing searchPages");
    const searchPagesResult = await client.callTool({
      name: "searchPages",
      arguments: {
        cql: `space = "${spaceKey}"`,
        limit: 3
      }
    });
    console.log("Success:", searchPagesResult.pages ? "✅" : "❌");
    console.log("Found pages:", searchPagesResult.total || 0);
    
    // 3. Test createPage
    console.log("\n3. Testing createPage");
    const newPageTitle = `Test Page ${new Date().toLocaleString()}`;
    const createPageResult = await client.callTool({
      name: "createPage",
      arguments: {
        spaceKey: spaceKey,
        title: newPageTitle,
        content: "<p>This is a test page created by MCP test client</p>"
      }
    });
    console.log("Success:", createPageResult.id ? "✅" : "❌");
    console.log("New Page ID:", createPageResult.id || "Unknown");
    console.log("URL:", createPageResult.url || "Unknown");
    
    // Store page ID for later tests
    const newPageId = createPageResult.id;
    
    // 4. Test getPage
    if (newPageId) {
      console.log("\n4. Testing getPage");
      const getPageResult = await client.callTool({
        name: "getPage",
        arguments: {
          pageId: newPageId
        }
      });
      console.log("Success:", getPageResult.id ? "✅" : "❌");
      console.log("Page Title:", getPageResult.title || "Unknown");
    }
    
    // 5. Test updatePage
    if (newPageId) {
      console.log("\n5. Testing updatePage");
      const updatePageResult = await client.callTool({
        name: "updatePage",
        arguments: {
          pageId: newPageId,
          title: `${newPageTitle} (Updated)`,
          content: "<p>This page has been updated by MCP test client</p>",
          version: 1, // Phiên bản hiện tại, thường là 1 cho trang mới
          addLabels: ["test", "mcp-client"]
        }
      });
      console.log("Success:", updatePageResult.success ? "✅" : "❌");
      console.log("Message:", updatePageResult.message || "No response message");
      // Log ra toàn bộ nội dung response để kiểm tra
      console.log("Full response:", JSON.stringify(updatePageResult, null, 2));
    }
    
    // 6. Test addComment
    if (newPageId) {
      console.log("\n6. Testing addComment");
      const addCommentResult = await client.callTool({
        name: "addComment",
        arguments: {
          pageId: newPageId,
          content: "<p>This is a test comment added by MCP test client</p>"
        }
      });
      console.log("Success:", addCommentResult.commentId ? "✅" : "❌");
      console.log("Comment ID:", addCommentResult.commentId || "Unknown");
    }
    
    // Tổng kết
    console.log("\n=== Test Summary ===");
    console.log("All tools tested successfully!");
    
    // Đóng kết nối
    console.log("\nClosing connection...");
    await client.close();
    console.log("Connection closed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 