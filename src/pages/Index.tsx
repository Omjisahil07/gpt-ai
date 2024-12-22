import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ActionButtons from '@/components/ActionButtons';
import MessageList from '@/components/MessageList';
import { useChatStore } from '@/hooks/useChatStore';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { apiKey, provider, addChat } = useChatStore();

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const newMessages = [
        ...messages,
        { role: 'user', content } as const
      ];
      
      setMessages(newMessages);

      let response;
      if (provider === 'gemini') {
        const geminiBody = {
          contents: [{
            parts: [{
              text: content
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: []
        };

        response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(geminiBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
        }

        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        addChat(updatedMessages);
      } else {
        // Call GPT API (using your existing implementation)
        // Simulate API delay for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = { ok: true };

        if (!response.ok) {
          throw new Error('Failed to get response from AI');
        }

        let assistantMessage: Message;
        assistantMessage = {
          role: 'assistant',
          content: "I am a hardcoded response. The database connection has been removed for testing purposes. You can modify this response in the Index.tsx file."
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        addChat(updatedMessages);
      }
    } catch (error: any) {
      console.error('API Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApiKeyChange={(key) => useChatStore.getState().setApiKey(key)}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <ChatHeader isSidebarOpen={isSidebarOpen} />
        
        <div className={`flex h-full flex-col ${messages.length === 0 ? 'items-center justify-center' : 'justify-between'} pt-[60px] pb-4`}>
          {messages.length === 0 ? (
            <div className="w-full max-w-3xl px-4 space-y-4">
              <div>
                <h1 className="mb-8 text-4xl font-semibold text-center">What can I help with?</h1>
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              </div>
              <ActionButtons />
            </div>
          ) : (
            <>
              <MessageList messages={messages} />
              <div className="w-full max-w-3xl mx-auto px-4 py-2">
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              </div>
              <div className="text-xs text-center text-gray-500 py-2">
                AI can make mistakes. Check important info.
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
