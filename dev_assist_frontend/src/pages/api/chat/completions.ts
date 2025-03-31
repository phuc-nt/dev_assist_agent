import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ApiResponse, Message } from '@/types';
import { generateOpenAIResponse, addMockMessage, getMockConversationById } from '@/utils/mockData';
import { v4 as uuidv4 } from 'uuid';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
// Flag for mocking API - set to false when actual backend is available
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

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
  res: NextApiResponse<ApiResponse<Message>>
) {
  // Only support POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get the request body (OpenAI-like format)
    const chatCompletionRequest = req.body;
    const userMessage = chatCompletionRequest.messages?.[0]?.content || '';
    const conversationId = chatCompletionRequest.conversation_id;

    if (!userMessage || !conversationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: messages or conversation_id' 
      });
    }

    // Add user message to mock DB if using mock API
    if (USE_MOCK_API) {
      // Check if conversation exists
      const conversation = getMockConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
      }

      // Add user message to the conversation
      const userMessageObj: Message = {
        id: uuidv4(),
        content: userMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      addMockMessage(conversationId, userMessageObj);
      
      // Generate mock response
      const mockResponse = generateOpenAIResponse(userMessage, conversationId);
      
      // Format bot response
      const botMessage: Message = {
        id: uuidv4(),
        content: mockResponse.choices[0].message.content,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      // Add bot message to the conversation
      addMockMessage(conversationId, botMessage);
      
      // Simulate network delay (200-800ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 200));
      
      return res.status(200).json({
        success: true,
        data: botMessage
      });
    }

    // If not using mock API, forward the request to the backend
    const response = await axios.post(
      `${BACKEND_API_URL}/chat/completions`,
      chatCompletionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward any authorization headers if present
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );

    // Process the response from backend
    const backendResponse = response.data;

    // Map the backend response to our frontend format
    // Assuming backend returns a response similar to OpenAI's format
    let messageResponse: Message;
    
    // If backend returns a formatted Message object
    if (backendResponse.success && backendResponse.data) {
      messageResponse = backendResponse.data;
    } 
    // If backend returns raw OpenAI-like response
    else if (backendResponse.choices && backendResponse.choices.length > 0) {
      const openAIResponse = backendResponse as OpenAIResponse;
      const choice = openAIResponse.choices[0];
      messageResponse = {
        id: openAIResponse.id || `msg_${Date.now()}`,
        content: choice.message.content,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
    } 
    // Fallback for unexpected response format
    else {
      throw new Error('Unexpected response format from backend');
    }

    // Return the response to the frontend
    res.status(200).json({
      success: true,
      data: messageResponse,
    });
  } catch (err) {
    console.error('Error processing request:', err);
    // Return a friendly error message
    res.status(500).json({
      success: false,
      error: 'Failed to get response from backend service',
    });
  }
} 