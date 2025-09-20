'use client';

import { useState, useEffect, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, onValue, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';

interface ChatMessage {
  id: string;
  message: string;
  attendeeName: string;
  attendeeEmail: string;
  timestamp: number;
  isAdmin?: boolean;
}

interface LivestreamChatProps {
  eventSlug: string;
  attendeeName: string;
  attendeeEmail: string;
  isVisible: boolean;
}

export default function LivestreamChat({ 
  eventSlug, 
  attendeeName, 
  attendeeEmail, 
  isVisible 
}: LivestreamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isVisible) return;

    const chatRef = ref(database, `livestream-chat/${eventSlug}`);
    const chatQuery = query(chatRef, orderByChild('timestamp'), limitToLast(100));

    const unsubscribe = onValue(chatQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]) => ({
          ...(value as Omit<ChatMessage, 'id'>),
          id: key,
        }));
        setMessages(messagesList);
        setTimeout(scrollToBottom, 100);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [eventSlug, isVisible]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    try {
      const chatRef = ref(database, `livestream-chat/${eventSlug}`);
      await push(chatRef, {
        message: newMessage.trim(),
        attendeeName,
        attendeeEmail,
        timestamp: serverTimestamp(),
        isAdmin: false,
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Live Q&A Chat</h3>
          <div className="flex items-center text-sm opacity-90">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live
          </div>
        </div>
        <p className="text-purple-100 text-sm mt-1">
          Ask questions and engage with other attendees
        </p>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
        style={{ maxHeight: 'calc(100% - 140px)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet.</p>
            <p className="text-sm">Be the first to ask a question!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group">
              <div className={`flex ${message.attendeeEmail === attendeeEmail ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.attendeeEmail === attendeeEmail
                    ? 'bg-purple-600 text-white'
                    : message.isAdmin
                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.attendeeEmail !== attendeeEmail && (
                    <div className={`text-xs font-medium mb-1 ${
                      message.isAdmin ? 'text-orange-700' : 'text-gray-600'
                    }`}>
                      {message.isAdmin ? '👑 ' : ''}{message.attendeeName}
                    </div>
                  )}
                  <p className="text-sm break-words">{message.message}</p>
                  <div className={`text-xs mt-1 ${
                    message.attendeeEmail === attendeeEmail 
                      ? 'text-purple-200' 
                      : message.isAdmin 
                      ? 'text-orange-600' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            maxLength={500}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSending ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Chatting as <strong>{attendeeName}</strong> • Be respectful and stay on topic
        </p>
      </div>
    </div>
  );
}
