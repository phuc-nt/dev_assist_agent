import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { FiSend, FiPlus } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onNewChat, 
  disabled = false 
}) => {
  const [message, setMessage] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150); // Max height: 150px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  };

  // Handle key press (Ctrl+Enter or Command+Enter to send)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send button click
  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, onSendMessage, disabled]);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <button
          className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onNewChat}
          title="New Conversation"
        >
          <FiPlus size={20} />
        </button>
        
        <div className="flex-grow relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your message..."
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-[150px] pr-10"
            rows={1}
          />
          
          <button
            className={`absolute right-2 bottom-2 p-1 rounded-full transition-colors ${
              message.trim() && !disabled
                ? 'text-blue-600 hover:bg-blue-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            title="Send Message"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press Ctrl+Enter or ⌘+Enter to send
      </div>
    </div>
  );
};

export default ChatInput; 