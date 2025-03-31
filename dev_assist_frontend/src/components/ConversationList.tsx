import React from 'react';
import { Conversation } from '@/types';
import { FiMessageSquare, FiTrash2, FiPlus } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}) => {
  // Format the date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="bg-gray-100 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <button 
          className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          onClick={onNew}
        >
          <FiPlus size={16} />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <FiMessageSquare size={40} className="mb-2" />
            <p>No conversations yet.</p>
            <p className="text-sm mt-1">Start a new chat to begin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <li 
                key={conversation.id} 
                className={`
                  relative
                  ${activeId === conversation.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <button
                  className="w-full text-left p-4 pr-10"
                  onClick={() => onSelect(conversation.id)}
                >
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <span>{formatDate(conversation.updatedAt)}</span>
                    <span>•</span>
                    <span>{conversation.messages.length} messages</span>
                  </div>
                </button>
                
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conversation.id);
                  }}
                  title="Delete conversation"
                >
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 