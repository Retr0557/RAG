import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import Spinner from './Spinner';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  statusMessage: string;
  pdfName: string;
  onReset: () => void;
  suggestedQuestions: string[];
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, statusMessage, pdfName, onReset, suggestedQuestions }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as any);
      }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-3 bg-brand-surface/50 border-b border-brand-primary flex justify-between items-center">
        <p className="text-sm text-brand-subtext truncate pr-4">
          Ready for questions about: <span className="font-bold text-brand-accent">{pdfName}</span>
        </p>
        <button
          onClick={onReset}
          className="px-3 py-1 text-sm bg-brand-secondary/80 hover:bg-brand-secondary text-white rounded-md transition-colors flex-shrink-0"
        >
          Upload New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} isLastMessage={index === messages.length -1} isLoading={isLoading}/>
        ))}
         {isLoading && statusMessage && messages[messages.length-1]?.content === '' && (
            <div className="flex items-center justify-start space-x-2">
                 <div className="flex items-center space-x-2">
                    <Spinner />
                    <p className="text-sm text-brand-subtext italic">{statusMessage}</p>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {suggestedQuestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2 border-t border-brand-primary pt-3">
            <p className="text-sm text-brand-subtext mb-2 text-center">Suggested Questions:</p>
            <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, i) => (
                    <button 
                        key={i} 
                        onClick={() => onSendMessage(q)}
                        className="px-3 py-1.5 text-sm bg-brand-primary border border-brand-secondary rounded-full hover:bg-brand-secondary transition-colors"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
      )}

      <div className="p-4 bg-brand-surface border-t border-brand-primary">
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
            className="flex-1 bg-brand-primary border border-brand-secondary rounded-lg p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none text-brand-text placeholder-brand-subtext transition-colors resize-none max-h-40"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-brand-accent text-white rounded-lg p-3 hover:bg-brand-accent-hover disabled:bg-brand-secondary disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;