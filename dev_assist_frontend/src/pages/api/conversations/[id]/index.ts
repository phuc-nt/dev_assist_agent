import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ApiResponse, Conversation } from '@/types';
import { 
  getMockConversationById, 
  deleteMockConversation 
} from '@/utils/mockData';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
// Flag for mocking API - set to false when actual backend is available
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation | boolean>>
) {
  switch (req.method) {
    case 'GET':
      return getConversation(req, res);
    case 'DELETE':
      return deleteConversation(req, res);
    default:
      return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

// GET /api/conversations/[id] - Get a specific conversation
async function getConversation(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Conversation>>
) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    // If using mock API, return mock data
    if (USE_MOCK_API) {
      // Simulate network delay (100-300ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const conversation = getMockConversationById(id);
      
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    }

    // If not using mock, forward the request to the backend
    const response = await axios.get(
      `${BACKEND_API_URL}/conversations/${id}`,
      {
        headers: {
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );
    
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error getting conversation:', err);
    return res.status(500).json({ success: false, error: 'Failed to get conversation' });
  }
}

// DELETE /api/conversations/[id] - Delete a specific conversation
async function deleteConversation(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<boolean>>
) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    // If using mock API, delete from mock data
    if (USE_MOCK_API) {
      // Simulate network delay (200-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
      
      const success = deleteMockConversation(id);
      
      if (!success) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
      
      return res.status(200).json({
        success: true,
        data: true,
      });
    }

    // If not using mock, forward the request to the backend
    const response = await axios.delete(
      `${BACKEND_API_URL}/conversations/${id}`,
      {
        headers: {
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        },
      }
    );
    
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete conversation' });
  }
} 