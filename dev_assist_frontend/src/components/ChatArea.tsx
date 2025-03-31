import React, { useEffect, useRef } from 'react';
import { Conversation } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { FiMessageSquare } from 'react-icons/fi';

interface ChatAreaProps {
  conversation: Conversation | null;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onNewChat: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  isLoading,
  onSendMessage,
  onNewChat,
}) => {
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // If no active conversation
  if (!conversation) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <FiMessageSquare size={64} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to DevAssist Bot</h2>
          <p className="text-gray-500 max-w-md mb-8">
            Your intelligent assistant for automating development tasks and managing projects.
          </p>
          <button
            onClick={onNewChat}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
          >
            Start a New Conversation
          </button>
        </div>
        <ChatInput 
          onSendMessage={onSendMessage} 
          onNewChat={onNewChat} 
          disabled={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="font-semibold truncate">{conversation.title}</h2>
        <div className="text-xs text-gray-500">
          {conversation.messages.length} messages
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <p>No messages yet.</p>
            <p className="text-sm mt-1">Start the conversation by sending a message.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
            
            {/* Show typing indicator when loading */}
            {isLoading && (
              <div className="flex items-center justify-start mb-4">
                <div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Input area */}
      <ChatInput 
        onSendMessage={onSendMessage} 
        onNewChat={onNewChat} 
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatArea; 