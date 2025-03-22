import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { OpenAI } from 'openai';
import get from "lodash/get"; // Cài nếu chưa có: npm install lodash

interface BotAction {
  type: 'fetch_recent_messages' | 'send_message' | 'nothing' ;
  payload: any;
}

interface Task {

}

@Injectable()
export class SlackService {
  private slackClient: WebClient;
  private openai: OpenAI;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // async exec (userRequest: string) : Promise <string> {
  //   let messages = '';
  //   const taskList = await this.analyzeRequest(userRequest);
  //   console.log(taskList);
  //   const actionList = await this.analyzeTasks(taskList.tasks);
  //   console.log(actionList);
  //   await this.handleActions(actionList);
  //   return "";
  // }
  

  // async analyzeRequest(userRequest: string): Promise<{ tasks: Task[] }> {
  //   const response = await this.openai.chat.completions.create({
  //     model: 'gpt-4o',
  //     messages: [
  //       { role: 'system', content: `Bạn là một AI assistant giúp phân tích và chia nhỏ công việc từ yêu cầu của người dùng ở cương vị ở 1 ứng dụng hoạt động, không phải step thông thường của con người. Hãy trả về JSON theo format:
  //       {
  //         "tasks": [
  //           { "description": "Mô tả công việc", "context": "Slack", "stepId": "step_x" }
  //         ]
  //       }` },
  //       { role: 'user', content: `Yêu cầu của khách hàng: ${userRequest}` }
  //     ],
  //     response_format: {
  //       type: "json_object"
  //     }
  //   });
  
  //   return JSON.parse(response.choices[0].message.content);
  // }
  
  // async analyzeTasks(tasks: Task[]): Promise<BotAction[]> {
  //   const response = await this.openai.chat.completions.create({
  //     model: 'gpt-4o',
  //     messages: [
  //       { role: 'system', content: `Bạn là một AI assistant giúp chọn action phù hợp cho từng công việc. Danh sách các task là: ${JSON.stringify(tasks)}. Trả về JSON theo format:
  //       {
  //         "actions": [
  //           { "stepId": "step_x", "type": "fetch_recent_messages" | "send_message| nothing", "payload": { ... } }
  //         ]
  //       } với payload là các properties trong api của slack` }
  //     ],
  //     response_format: {
  //       type: "json_object"
  //     }
  //   });
  
  //   return JSON.parse(response.choices[0].message.content).actions;
  // }
  

  // async sendMessage(channel: string, text: string) {
  //   return this.slackClient.chat.postMessage({channel, text});
  // }
  
  // async handleActions(actions: BotAction[])  {
  //   for (const action of actions) {
  //     switch (action.type) {
  //       case 'fetch_recent_messages':
  //         const messages = await this.getRecentMessages(action.payload.channel, action.payload.days);
  //         console.log('Messages:', messages);
  //         break;
  //       case 'send_message':
  //         console.log(action);
  //         await this.sendMessage(action.payload.channel, action.payload.text);
  //         break;
  //       case 'nothing':
  //         break;
  //       default:
  //         console.warn(`Unknown action: ${action.type}`);
  //     }
  //   }
  // }
  

  // async getChannelList(): Promise<{ id: string; name: string }[]> {
  //   const response = await this.slackClient.conversations.list();
  //   const channels = response.channels.map((channel) => ({
  //     id: channel.id,
  //     name: channel.name,
  //   }));
  //   return channels;
  // }

  // async getRecentMessages(channelId: string, days: number = 5): Promise<any[]> {
  //   const currentTime = Math.floor(Date.now() / 1000); // Thời gian hiện tại (timestamp)
  //   const fromTime = currentTime - days * 24 * 60 * 60; // Lùi lại `days` ngày

  //   const response = await this.slackClient.conversations.history({
  //     channel: channelId,
  //     oldest: fromTime.toString(), // Lấy tin nhắn từ `fromTime`
  //     limit: 100, // Giới hạn số tin nhắn lấy về
  //   });

  //   return response.messages || [];
  // }

  async processUserRequest(userMessage: string) {
    const tasks = await this.analyzeRequestNew(userMessage); // AI xác định action cần làm
    console.log(tasks);
    
    let results: Record<string, any> = {};
  
    for (const task of tasks.tasks) {
      // Thay thế dữ liệu nếu task cần kết quả từ task trước
      for (let key in task.params) {
        if (typeof task.params[key] === "string" && task.params[key].includes("<result_of_")) {
          const refTask = task.params[key].match(/<result_of_(.*?)>/)?.[1];
          if (refTask && results[refTask]) {
            // 🔥 Nếu kết quả là danh sách tin nhắn, lấy tin đầu tiên
            if (Array.isArray(results[refTask]?.messages)) {
              task.params[key] = results[refTask].messages[0]?.text || "Không có nội dung";
            } else {
              task.params[key] = results[refTask];
            }
          }
        }
      }
      console.log("🔥 Nội dung tin nhắn được thay thế:", task.params.text);

      // Gọi Slack SDK với method và params mà AI quyết định
      results[task.task] = await this.executeSlackTask(task.method, task.params);
      console.log(results[task.task]);
      
    }
  
    return results;
  }

  async analyzeRequestNew(userMessage: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Bạn là một AI assistant giúp xử lý yêu cầu liên quan đến Slack bằng Bot Token." },
        { role: "system", content: "Luôn thay thế tham số bằng <result_of_task> nếu cần dữ liệu từ task trước. Ví dụ: gửi tin nhắn từ kết quả conversations.history thì text phải là <result_of_fetch_messages>." },
        { role: "user", content: userMessage }
      ],
      functions: [
        {
          name: "determine_slack_actions",
          description: "Xác định các hành động Slack cần thực hiện từ yêu cầu của người dùng, bao gồm cả tham số cần thiết.",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task: { type: "string", description: "Tên nhiệm vụ (ví dụ: fetch_users, send_message)." },
                    method: { type: "string", description: "Method của Slack SDK để gọi (ví dụ: users.list, chat.postMessage)." },
                    params: {
                      type: "object",
                      description: "Tham số cần thiết cho method của Slack SDK, phải được lấy từ thông tin yêu cầu của người dùng.",
                      properties: {
                        channel: { type: "string", description: "ID của channel, nếu có trong yêu cầu." },
                        user: { type: "string", description: "ID của user, nếu có trong yêu cầu." },
                        text: { type: "string", description: "Nội dung tin nhắn, nếu có trong yêu cầu." },
                        limit: { type: "number", description: "Số lượng kết quả trả về, nếu có trong yêu cầu." }
                      },
                      additionalProperties: true
                    }
                  },
                  required: ["task", "method", "params"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      ],      
      function_call: "auto"
    });

    const functionResponse = response.choices[0]?.message?.function_call;
    if (functionResponse?.name === "determine_slack_actions") {
      return JSON.parse(functionResponse.arguments);
    }
  
    throw new Error("AI không thể xác định được action.");
  }

  async executeSlackTask(method: string, params: any) {    
    const slackMethod = get(this.slackClient, method);

    if (typeof slackMethod !== "function") {
      throw new Error(`Unknown Slack method: ${method}`);
    }
  
    return await slackMethod(params);
  }
}
