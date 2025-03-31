import React, { useMemo } from 'react';
import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FiUser, FiServer, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { content, sender, timestamp, status } = message;
  
  const formattedTime = useMemo(() => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }, [timestamp]);

  // Define styles based on sender
  const isUser = sender === 'user';
  
  const containerClasses = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
  
  const messageClasses = `
    max-w-[80%] px-4 py-2 rounded-lg
    ${isUser 
      ? 'bg-blue-600 text-white rounded-br-none' 
      : 'bg-gray-200 text-gray-800 rounded-bl-none'
    }
  `;
  
  const iconClasses = `
    w-8 h-8 rounded-full flex items-center justify-center
    ${isUser 
      ? 'bg-blue-700 text-white ml-2' 
      : 'bg-gray-300 text-gray-600 mr-2'
    }
  `;

  // Status indicator
  const renderStatus = () => {
    switch (status) {
      case 'sending':
        return <FiClock className="text-gray-400 ml-1" title="Sending..." />;
      case 'sent':
        return <FiCheckCircle className="text-green-500 ml-1" title="Sent" />;
      case 'error':
        return <FiAlertCircle className="text-red-500 ml-1" title="Error" />;
      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className={iconClasses}>
          <FiServer size={16} />
        </div>
      )}
      
      <div className="flex flex-col">
        <div className={messageClasses}>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        
        <div className={`text-xs mt-1 text-gray-500 flex items-center ${isUser ? 'self-end' : 'self-start'}`}>
          {formattedTime}
          {renderStatus()}
        </div>
      </div>
      
      {isUser && (
        <div className={iconClasses}>
          <FiUser size={16} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 