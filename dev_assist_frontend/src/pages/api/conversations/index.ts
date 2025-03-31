import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ApiResponse, Conversation } from '@/types';
import { 
  createMockConversation, 
  addMockConversation, 
  getMockConversations 
} from '@/utils/mockData';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
// Flag for mocking API - set to false when actual backend is available
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation | Conversation[]>>
) {
  switch (req.method) {
    case 'GET':
      return getConversations(req, res);
    case 'POST':
      return createConversation(req, res);
    default:
      return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

// GET /api/conversations - Get all conversations
async function getConversations(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation[]>>
) {
  try {
    // If using mock API, return mock data
    if (USE_MOCK_API) {
      // Simulate network delay (100-300ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const conversations = getMockConversations();
      return res.status(200).json({
        success: true,
        data: conversations,
      });
    }
    
    // If not using mock, forward the request to the backend
    const response = await axios.get(
      `${BACKEND_API_URL}/conversations`,
      {
        headers: {
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );
    
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    });
  }
}

// POST /api/conversations - Create a new conversation
async function createConversation(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation>>
) {
  try {
    // If using mock API, create a mock conversation
    if (USE_MOCK_API) {
      // Simulate network delay (200-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
      
      const newConversation = createMockConversation();
      addMockConversation(newConversation);
      
      return res.status(201).json({
        success: true,
        data: newConversation,
      });
    }
    
    // If not using mock, forward the request to the backend
    const response = await axios.post(
      `${BACKEND_API_URL}/conversations`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );
    
    return res.status(201).json(response.data);
  } catch (err) {
    console.error('Error creating conversation:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
    });
  }
} 