import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { conversationApi } from '@/services/api';
import {
  addMessage,
  createConversation,
  deleteConversation,
  setActiveConversation,
  updateMessageStatus,
  setLoading,
  setError,
} from '@/redux/slices/chatSlice';
import { Message } from '@/types';

const useChat = () => {
  const dispatch = useAppDispatch();
  const {
    conversations,
    activeConversationId,
    isLoading,
    error,
  } = useAppSelector((state) => state.chat);

  // Get active conversation
  const activeConversation = useCallback(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Fetch conversation messages from backend when selecting a conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeConversationId) {
        const currentConversation = activeConversation();
        
        // Only fetch if the conversation exists but has no messages
        // This would happen for conversations loaded from the backend
        if (currentConversation && currentConversation.messages.length === 0) {
          try {
            dispatch(setLoading(true));
            const response = await conversationApi.getHistory(activeConversationId);
            
            if (response.success && response.data) {
              // Add each message to the conversation
              response.data.forEach(message => {
                dispatch(addMessage({
                  conversationId: activeConversationId,
                  message: {
                    content: message.content,
                    sender: message.sender,
                    status: 'sent'
                  }
                }));
              });
            }
          } catch (err) {
            dispatch(setError(err instanceof Error ? err.message : 'Failed to load conversation history'));
          } finally {
            dispatch(setLoading(false));
          }
        }
      }
    };
    
    fetchMessages();
  }, [activeConversationId, dispatch, activeConversation]);

  // Start a new conversation
  const startNewConversation = useCallback(async () => {
    dispatch(setLoading(true));
    
    try {
      // Try to create conversation on backend first
      const response = await conversationApi.create();
      
      if (response.success && response.data) {
        // If backend responds with a conversation object, use it
        const { id, title, messages = [], createdAt, updatedAt } = response.data;
        
        // Create conversation in Redux with the ID from backend
        dispatch(createConversation({
          id,
          title,
          messages,
          createdAt,
          updatedAt
        }));
        
        // Set as active
        dispatch(setActiveConversation(id));
      } else {
        // Fallback to local creation if backend fails
        dispatch(createConversation());
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      // Fallback to local creation
      dispatch(createConversation());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Select an existing conversation
  const selectConversation = useCallback((conversationId: string) => {
    dispatch(setActiveConversation(conversationId));
  }, [dispatch]);

  // Send a message and get response from the bot
  const sendMessage = useCallback(
    async (content: string) => {
      // If no active conversation, create one
      if (!activeConversationId) {
        await startNewConversation();
      }
      
      const currentConvId = activeConversationId || conversations[conversations.length - 1]?.id;
      
      if (!currentConvId) return;
      
      // Add user message to the conversation
      const userMessage: Omit<Message, 'id' | 'timestamp'> = {
        content,
        sender: 'user',
        status: 'sending',
      };
      
      dispatch(addMessage({ conversationId: currentConvId, message: userMessage }));
      
      try {
        dispatch(setLoading(true));
        
        // Send the message to the API
        const response = await conversationApi.sendMessage(currentConvId, content);
        
        // Update user message status to sent
        const messages = activeConversation()?.messages || [];
        const lastUserMessageId = messages.findLast(m => m.sender === 'user')?.id;
        
        if (lastUserMessageId) {
          dispatch(updateMessageStatus({
            conversationId: currentConvId,
            messageId: lastUserMessageId,
            status: 'sent',
          }));
        }
        
        // Add bot response
        if (response.success && response.data) {
          const botMessage: Omit<Message, 'id' | 'timestamp'> = {
            content: response.data.content,
            sender: 'bot',
            status: 'sent',
          };
          
          dispatch(addMessage({ conversationId: currentConvId, message: botMessage }));
        } else {
          throw new Error(response.error || 'Failed to get response');
        }
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : 'An unknown error occurred'));
        
        // Add error message
        const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
          content: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          status: 'error',
        };
        
        dispatch(addMessage({ conversationId: currentConvId, message: errorMessage }));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, activeConversationId, conversations, activeConversation, startNewConversation]
  );

  // Remove a conversation
  const removeConversation = useCallback(
    async (conversationId: string) => {
      try {
        dispatch(setLoading(true));
        
        // Call API to delete conversation
        await conversationApi.delete(conversationId);
        
        // Update state
        dispatch(deleteConversation(conversationId));
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : 'Failed to delete conversation'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    conversations,
    activeConversationId,
    activeConversation: activeConversation(),
    isLoading,
    error,
    startNewConversation,
    selectConversation,
    sendMessage,
    removeConversation,
  };
};

export default useChat; 