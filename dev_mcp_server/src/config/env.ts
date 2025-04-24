import dotenv from 'dotenv';
import { z } from 'zod';

// Load biến môi trường từ file .env
dotenv.config();

// Xác định nếu đang chạy trong môi trường test
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.argv.includes('jest');

// Schema xác thực các biến môi trường
const envSchema = z.object({
  // JIRA configuration
  JIRA_API_TOKEN: z.string().default('dummy_token'),
  JIRA_EMAIL: isTestEnvironment 
    ? z.string().default('test@example.com') 
    : z.string().email('Invalid JIRA email'),
  
  // Confluence configuration
  CONFLUENCE_API_TOKEN: z.string().default('dummy_token'),
  CONFLUENCE_EMAIL: isTestEnvironment 
    ? z.string().default('test@example.com') 
    : z.string().email('Invalid Confluence email'),
  
  // Slack configuration
  SLACK_BOT_TOKEN: z.string().default('dummy_token'),
  
  // Server configuration
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().default('dummy_key'),
});

// Parse và xác thực biến môi trường
let configEnv = {
  jira: {
    apiToken: 'dummy_token',
    email: 'test@example.com',
  },
  confluence: {
    apiToken: 'dummy_token',
    email: 'test@example.com',
  },
  slack: {
    botToken: 'dummy_token',
  },
  server: {
    port: 3000,
  },
  openai: {
    apiKey: 'dummy_key',
  }
};

try {
  const env = envSchema.parse(process.env);
  
  configEnv = {
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
  if (!isTestEnvironment) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  } else {
    console.warn('⚠️ Using default environment in test mode');
  }
}

export default configEnv; 