import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { OpenAI } from 'openai';

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

  async exec (userRequest: string) : Promise <string> {
    let messages = '';
    const taskList = await this.analyzeRequest(userRequest);
    console.log(taskList);
    const actionList = await this.analyzeTasks(taskList.tasks);
    console.log(actionList);
    await this.handleActions(actionList);
    return "";
  }
  

  async analyzeRequest(userRequest: string): Promise<{ tasks: Task[] }> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `Bạn là một AI assistant giúp phân tích và chia nhỏ công việc từ yêu cầu của người dùng ở cương vị ở 1 ứng dụng hoạt động, không phải step thông thường của con người. Hãy trả về JSON theo format:
        {
          "tasks": [
            { "description": "Mô tả công việc", "context": "Slack", "stepId": "step_x" }
          ]
        }` },
        { role: 'user', content: `Yêu cầu của khách hàng: ${userRequest}` }
      ],
      response_format: {
        type: "json_object"
      }
    });
  
    return JSON.parse(response.choices[0].message.content);
  }
  
  async analyzeTasks(tasks: Task[]): Promise<BotAction[]> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `Bạn là một AI assistant giúp chọn action phù hợp cho từng công việc. Danh sách các task là: ${JSON.stringify(tasks)}. Trả về JSON theo format:
        {
          "actions": [
            { "stepId": "step_x", "type": "fetch_recent_messages" | "send_message| nothing", "payload": { ... } }
          ]
        } với payload là các properties trong api của slack` }
      ],
      response_format: {
        type: "json_object"
      }
    });
  
    return JSON.parse(response.choices[0].message.content).actions;
  }
  

  async sendMessage(channel: string, text: string) {
    return this.slackClient.chat.postMessage({channel, text});
  }
  
  async handleActions(actions: BotAction[])  {
    for (const action of actions) {
      switch (action.type) {
        case 'fetch_recent_messages':
          const messages = await this.getRecentMessages(action.payload.channel, action.payload.days);
          console.log('Messages:', messages);
          break;
        case 'send_message':
          console.log(action);
          await this.sendMessage(action.payload.channel, action.payload.text);
          break;
        case 'nothing':
          break;
        default:
          console.warn(`Unknown action: ${action.type}`);
      }
    }
  }
  

  async getChannelList(): Promise<{ id: string; name: string }[]> {
    const response = await this.slackClient.conversations.list();
    const channels = response.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
    }));
    return channels;
  }

  async getRecentMessages(channelId: string, days: number = 5): Promise<any[]> {
    const currentTime = Math.floor(Date.now() / 1000); // Thời gian hiện tại (timestamp)
    const fromTime = currentTime - days * 24 * 60 * 60; // Lùi lại `days` ngày

    const response = await this.slackClient.conversations.history({
      channel: channelId,
      oldest: fromTime.toString(), // Lấy tin nhắn từ `fromTime`
      limit: 100, // Giới hạn số tin nhắn lấy về
    });

    return response.messages || [];
  }
  
}
