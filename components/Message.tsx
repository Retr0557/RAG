import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

declare const marked: any;

interface MessageProps {
  message: ChatMessage;
  isLastMessage: boolean;
  isLoading: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isLastMessage, isLoading }) => {
  const { role, content } = message;
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (contentRef.current) {
        // Render markdown
        contentRef.current.innerHTML = marked.parse(content);
        
        // Add copy buttons to pre elements
        const preElements = contentRef.current.querySelectorAll('pre');
        preElements.forEach(pre => {
            const code = pre.querySelector('code');
            if (code) {
                // Add styling to pre
                pre.classList.add('bg-brand-bg', 'p-4', 'rounded-md', 'my-2', 'relative');
                
                const copyButton = document.createElement('button');
                copyButton.innerHTML = `<svg class="h-5 w-5"><use href="#copy-icon"></use></svg>`;
                copyButton.className = 'absolute top-2 right-2 p-1 rounded-md bg-brand-secondary/50 text-brand-subtext hover:text-brand-text transition-colors';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(code.innerText);
                    copyButton.innerHTML = 'Copied!';
                    setTimeout(() => {
                       copyButton.innerHTML = `<svg class="h-5 w-5"><use href="#copy-icon"></use></svg>`;
                    }, 2000);
                };
                pre.appendChild(copyButton);
            }
        });
    }
  }, [content]);

  const baseClasses = "p-3 rounded-lg max-w-xl shadow-md";
  
  if (role === 'system') {
    return (
      <div className="text-center text-sm text-brand-subtext italic my-2">
        {content}
      </div>
    );
  }
  
  const showTypingIndicator = isLastMessage && isLoading && role === 'model';

  const roleClasses = {
    user: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white self-end rounded-br-none",
    model: "bg-brand-primary text-brand-text self-start rounded-bl-none",
  };

  const wrapperClasses = {
    user: "flex justify-end",
    model: "flex justify-start",
  };

  return (
    <div className={wrapperClasses[role]}>
      <div className={`${baseClasses} ${roleClasses[role]}`}>
        <div ref={contentRef} className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3">
          {/* This will be replaced by marked.js output */}
          {content}
        </div>
        {showTypingIndicator && <span className="animate-pulse">▍</span>}
      </div>
    </div>
  );
};

export default Message;