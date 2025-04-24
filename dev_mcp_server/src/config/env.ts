import dotenv from 'dotenv';
import { z } from 'zod';

// Load biến môi trường từ file .env
dotenv.config();

// Schema xác thực các biến môi trường
const envSchema = z.object({
  // JIRA configuration
  JIRA_API_TOKEN: z.string().min(1, 'JIRA API Token is required'),
  JIRA_EMAIL: z.string().email('Invalid JIRA email'),
  
  // Confluence configuration
  CONFLUENCE_API_TOKEN: z.string().min(1, 'Confluence API Token is required'),
  CONFLUENCE_EMAIL: z.string().email('Invalid Confluence email'),
  
  // Slack configuration
  SLACK_BOT_TOKEN: z.string().min(1, 'Slack Bot Token is required'),
  
  // Server configuration
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
});

// Parse và xác thực biến môi trường
try {
  const env = envSchema.parse(process.env);
  
  export default {
    jira: {
      apiToken: env.JIRA_API_TOKEN,
      email: env.JIRA_EMAIL,
    },
    confluence: {
      apiToken: env.CONFLUENCE_API_TOKEN,
      email: env.CONFLUENCE_EMAIL,
    },
    slack: {
      botToken: env.SLACK_BOT_TOKEN,
    },
    server: {
      port: env.PORT,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
    }
  };
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
} 