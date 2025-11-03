import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from './types';
import PdfUpload from './components/PdfUpload';
import Chat from './components/Chat';
import { processPdf, getRelevantChunks } from './services/ragService';
import { generateAnswerStream, generateSampleQuestions } from './services/geminiService';

const samplePdfChunks = [
    "Gemini is a family of generative AI models, developed by Google, that allows developers to generate content and solve problems.",
    "These multimodal models can process information from text, code, images, and video. This guide provides information about Gemini models, and guidance on how to use them in your applications.",
    "The Gemini 1.0 model is available in two sizes: Gemini 1.0 Pro model - The mid-size and most capable model in the Gemini 1.0 release. It's designed to handle a wide range of tasks and is the recommended model for most use cases. Gemini 1.0 Pro has a 32K context window for text, and is available in 180+ countries and territories through the Gemini API.",
    "Safety is a key priority for Google. The models have been tested and evaluated for safety, and the API includes safety filters to block harmful content. You can learn more about the safety features in the safety guide.",
    "To use the Gemini API, you need an API key. You can create a key with one click in Google AI Studio. The API is free to use for now, with rate limits.",
    "You can interact with Gemini models using the Google AI Studio, or by making calls to the Gemini API from your applications. You can use the Gemini API with a variety of programming languages, including Python, Go, Node.js, and Dart (Flutter).",
];

const App: React.FC = () => {
  const [pdfChunks, setPdfChunks] = useState<string[]>([]);
  const [pdfName, setPdfName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (pdfChunks.length > 0 && messages.length === 1) { // After initial system message
        generateSuggestions();
    }
  }, [pdfChunks, messages]);


  const generateSuggestions = async () => {
    setStatusMessage('Generating question suggestions...');
    setIsLoading(true);
    try {
        const context = getRelevantChunks("", pdfChunks, 5).join('\n\n');
        const questions = await generateSampleQuestions(context);
        setSuggestedQuestions(questions);
    } catch (err) {
        console.error("Failed to generate suggestions:", err);
        // Don't show an error to the user, just fail gracefully
    } finally {
        setIsLoading(false);
        setStatusMessage('');
    }
  };

  const handlePdfUpload = async (file: File) => {
    setIsLoading(true);
    setStatusMessage('Processing PDF... this may take a moment.');
    setError('');
    setSuggestedQuestions([]);
    try {
      const chunks = await processPdf(file);
      setPdfChunks(chunks);
      setPdfName(file.name);
      setMessages([
        {
          role: 'system',
          content: `Successfully processed "${file.name}". You can now ask questions about its content.`,
        },
      ]);
    } catch (err) {
      setError('Failed to process PDF. Please try a different file.');
      console.error(err);
      setIsLoading(false);
      setStatusMessage('');
    }
  };
  
  const handleTrySample = () => {
    setIsLoading(true);
    setStatusMessage('Loading sample document...');
    setError('');
    setSuggestedQuestions([]);

    setTimeout(() => {
        setPdfChunks(samplePdfChunks);
        setPdfName("Gemini API FAQ.pdf");
        setMessages([
          {
            role: 'system',
            content: `Successfully loaded sample "Gemini API FAQ.pdf". You can now ask questions about its content.`,
          },
        ]);
    }, 500); // Simulate loading
  };

  const handleSendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]); // Add empty model message
    setIsLoading(true);
    setStatusMessage('Finding relevant information...');
    setError('');
    setSuggestedQuestions([]);

    try {
      // RAG - Retrieve
      const relevantChunks = getRelevantChunks(query, pdfChunks);
      const context = relevantChunks.join('\n\n');
      
      setStatusMessage('Generating answer...');

      // RAG - Generate (Streaming)
      await generateAnswerStream(query, context, (chunk) => {
          setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.role === 'model') {
                  return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + chunk }];
              }
              return prev;
          });
      });

    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]); // Replace empty message with error
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }, [isLoading, pdfChunks]);

  const handleReset = () => {
    setPdfChunks([]);
    setPdfName('');
    setMessages([]);
    setError('');
    setSuggestedQuestions([]);
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text font-sans">
      <header className="bg-brand-surface p-4 shadow-md z-10 border-b border-brand-primary">
        <h1 className="text-xl md:text-2xl font-bold text-center text-brand-accent">📄 Document Q&A Bot</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col bg-brand-surface rounded-lg shadow-2xl">
          {pdfChunks.length === 0 ? (
            <PdfUpload onPdfUpload={handlePdfUpload} onTrySample={handleTrySample} isLoading={isLoading} statusMessage={statusMessage} error={error} />
          ) : (
            <Chat 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              statusMessage={statusMessage}
              pdfName={pdfName}
              onReset={handleReset}
              suggestedQuestions={suggestedQuestions}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;