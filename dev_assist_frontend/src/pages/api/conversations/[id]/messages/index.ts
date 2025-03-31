import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ApiResponse, Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { 
  getMockConversationById, 
  generateOpenAIResponse, 
  addMockMessage 
} from '@/utils/mockData';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
// Flag for mocking API - set to false when actual backend is available
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// Interface cho message trả về từ backend
interface BackendMessage {
  id?: string;
  content: string;
  role?: string;
  created_at?: string;
}

// Interface cho OpenAI-like response
interface OpenAIChoice {
  message: {
    content: string;
    role?: string;
  };
  index?: number;
  finish_reason?: string;
}

interface OpenAIResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Message | Message[]>>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
  }

  switch (req.method) {
    case 'GET':
      return getMessages(req, res, id);
    case 'POST':
      return addMessage(req, res, id);
    default:
      return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

// GET /api/conversations/[id]/messages - Get all messages for a conversation
async function getMessages(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Message[]>>,
  conversationId: string
) {
  try {
    // If using mock API, return messages from mock conversation
    if (USE_MOCK_API) {
      // Simulate network delay (100-300ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const conversation = getMockConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      
      return res.status(200).json({
        success: true,
        data: conversation.messages,
      });
    }
    
    // Forward the request to the backend
    const response = await axios.get(
      `${BACKEND_API_URL}/conversations/${conversationId}/messages`,
      {
        headers: {
          // Forward any authorization headers if present
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );

    // Process the response from backend
    const backendResponse = response.data;

    // If backend returns a standard response format
    if (backendResponse.success && backendResponse.data) {
      return res.status(200).json(backendResponse);
    }
    
    // If backend returns a different format, map it to our format
    // Assuming an array of messages
    if (Array.isArray(backendResponse)) {
      const messages: Message[] = backendResponse.map((msg: BackendMessage) => {
        // Determine the sender type, ensuring it's either 'user' or 'bot'
        const senderType: 'user' | 'bot' = msg.role === 'user' ? 'user' : 'bot';
        
        return {
          id: msg.id || `msg_${Date.now()}`,
          content: msg.content,
          sender: senderType,
          timestamp: msg.created_at || new Date().toISOString(),
          status: 'sent',
        };
      });
      
      return res.status(200).json({
        success: true,
        data: messages,
      });
    }
    
    throw new Error('Unexpected response format from backend');
  } catch (err) {
    console.error('Error fetching messages from backend:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch messages from backend service',
    });
  }
}

// POST /api/conversations/[id]/messages - Add a message to a conversation
// This is a fallback for direct message sending (not using chat completions)
async function addMessage(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Message>>,
  conversationId: string
) {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Missing message content' });
    }

    // If using mock API, handle with mock data
    if (USE_MOCK_API) {
      // Check if conversation exists
      const conversation = getMockConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      // Add user message to conversation
      const userMessage: Message = {
        id: uuidv4(),
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      addMockMessage(conversationId, userMessage);
      
      // Generate mock response
      const mockResponse = generateOpenAIResponse(content, conversationId);
      
      // Format bot response
      const botMessage: Message = {
        id: uuidv4(),
        content: mockResponse.choices[0].message.content,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      
      // Add bot message to conversation
      addMockMessage(conversationId, botMessage);
      
      // Simulate network delay (300-800ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
      
      return res.status(200).json({
        success: true,
        data: botMessage,
      });
    }

    // Forward to the chat/completions endpoint
    const chatCompletionRequest = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: content
        }
      ],
      conversation_id: conversationId,
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Forward the request to the backend
    const response = await axios.post(
      `${BACKEND_API_URL}/chat/completions`,
      chatCompletionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );

    // Process the response similar to chat/completions endpoint
    const backendResponse = response.data;
    
    let messageResponse: Message;
    
    if (backendResponse.success && backendResponse.data) {
      messageResponse = backendResponse.data;
    } else if (backendResponse.choices && backendResponse.choices.length > 0) {
      const openAIResponse = backendResponse as OpenAIResponse;
      const choice = openAIResponse.choices[0];
      messageResponse = {
        id: openAIResponse.id || `msg_${Date.now()}`,
        content: choice.message.content,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
    } else {
      throw new Error('Unexpected response format from backend');
    }

    return res.status(200).json({
      success: true,
      data: messageResponse,
    });
  } catch (err) {
    console.error('Error sending message to backend:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message to backend service',
    });
  }
} 