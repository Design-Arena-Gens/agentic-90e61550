'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'2.5' | '3.0'>('3.0');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          model: model,
          previousMessages: messages,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.text || 'Image generated successfully',
            image: data.image,
          },
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to generate response. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-purple-500/30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            AI Image Chat Studio
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-white text-sm font-medium">Model:</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as '2.5' | '3.0')}
              className="bg-white/10 text-white border border-purple-500/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="2.5">Imagen 2.5</option>
              <option value="3.0">Imagen 3.0</option>
            </select>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-white/60 mt-20">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to AI Image Chat Studio</h2>
              <p className="text-lg">Start by describing an image you'd like to create, or ask to modify an existing one!</p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/5 backdrop-blur p-4 rounded-lg border border-purple-500/30">
                  <div className="text-2xl mb-2">🖼️</div>
                  <p className="text-sm text-left">Generate: "Create a futuristic city at sunset"</p>
                </div>
                <div className="bg-white/5 backdrop-blur p-4 rounded-lg border border-purple-500/30">
                  <div className="text-2xl mb-2">✏️</div>
                  <p className="text-sm text-left">Edit: "Make it more colorful and add flying cars"</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 backdrop-blur-lg text-white border border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.image && (
                      <div className="mt-4">
                        <img
                          src={message.image}
                          alt="Generated"
                          className="rounded-lg max-w-full h-auto shadow-2xl border border-purple-500/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/30 backdrop-blur-lg border-t border-purple-500/30 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe an image or ask to modify the previous one..."
              className="flex-1 bg-white/10 text-white placeholder-white/40 border border-purple-500/50 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  Send
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
