import React, { useState } from 'react';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import useChat from '@/hooks/useChat';
import { FiMenu, FiX } from 'react-icons/fi';

const ChatLayout: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    activeConversation,
    isLoading,
    startNewConversation,
    selectConversation,
    sendMessage,
    removeConversation,
  } = useChat();

  // State for sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when selecting a conversation on mobile
  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-white rounded-md shadow-md"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
      
      {/* Sidebar */}
      <div 
        className={`
          lg:w-80 w-full fixed lg:static inset-0 z-10 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full">
          <ConversationList 
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onDelete={removeConversation}
            onNew={startNewConversation}
          />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <ChatArea 
          conversation={activeConversation}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onNewChat={startNewConversation}
        />
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-5"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatLayout; 