import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, CheckCheck } from 'lucide-react';
import { User, ChatConversation, ChatMessage } from '../../types';
import { store } from '../../services/store';

interface ChatSupportModalProps {
  currentUser: User | null;
}

export const ChatSupportModal: React.FC<ChatSupportModalProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Start chat form state (pre-filled if logged in)
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Lana Silva');
  const [email, setEmail] = useState(currentUser?.email || 'lanasilva4055@gmail.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+447349834975');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync current user info
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setEmail(currentUser.email);
      setPhone(currentUser.phone);
    }
  }, [currentUser?.id]);

  // Load existing conversation
  const loadConversation = () => {
    const convs = store.getConversations();
    if (currentUser) {
      let match = convs.find(c => c.userId === currentUser.id || c.customerEmail === currentUser.email);
      if (!match) {
        match = store.startConversation(currentUser.fullName, currentUser.email, currentUser.phone, currentUser.id);
      }
      setConversation(match);
      setMessages(store.getMessages(match.id));
    } else if (convs.length > 0) {
      // Guest or default
      setConversation(convs[0]);
      setMessages(store.getMessages(convs[0].id));
    }
  };

  useEffect(() => {
    loadConversation();
    const handleStorage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (key && !['chat_messages', 'chat_conversations', 'server_sync', 'broadcast'].includes(key)) {
        return;
      }
      loadConversation();
    };
    window.addEventListener('nexo_storage_change', handleStorage);
    return () => window.removeEventListener('nexo_storage_change', handleStorage);
  }, [currentUser?.id]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('nexo_open_chat', handleOpenChat);
    return () => window.removeEventListener('nexo_open_chat', handleOpenChat);
  }, []);

  // Calculate unread messages from support
  const unreadSupportCount = messages.filter(
    (m) => m.senderRole === 'support' && !m.read
  ).length;

  // When chat opens, mark support messages as read
  useEffect(() => {
    if (isOpen && conversation?.id) {
      const allMsgs = store.getMessages(conversation.id);
      let hasUnread = false;
      allMsgs.forEach((m) => {
        if (m.senderRole === 'support' && !m.read) {
          m.read = true;
          hasUnread = true;
        }
      });
      if (hasUnread) {
        store.saveMessages(allMsgs);
        setMessages(allMsgs);
      }
    }
  }, [isOpen, conversation?.id]);

  useEffect(() => {
    if (isOpen && conversation?.id) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, conversation?.id]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    const conv = store.startConversation(fullName, email, phone, currentUser?.id);
    setConversation(conv);
    setMessages(store.getMessages(conv.id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation) return;

    const text = inputMessage.trim();
    setInputMessage('');

    // Send customer message to centralized backend store (Admin sees it in real time)
    store.addMessage({
      conversationId: conversation.id,
      senderId: currentUser?.id || 'guest',
      senderName: currentUser?.fullName || fullName,
      senderRole: 'customer',
      message: text,
    });

    setMessages(store.getMessages(conversation.id));
    // Notice: Strictly no automated/simulated responses.
    // The administrator manually types and replies via Admin Portal.
  };

  return (
    <>
      {/* Floating Button (Golden Yellow Pill) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-18 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs shadow-[0_4px_20px_rgba(230,185,47,0.35)] transition-all transform hover:scale-105 active:scale-95"
        aria-label="Toggle chat support"
      >
        <span className="relative flex items-center justify-center">
          <MessageSquare className="w-4 h-4 fill-black/10" />
          {unreadSupportCount > 0 ? (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-red-600 text-white font-extrabold text-[9px] flex items-center justify-center border border-black shadow-sm animate-bounce">
              {unreadSupportCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#21D39B] ring-2 ring-[#E6B92F]" />
          )}
        </span>
        <span>{isOpen ? 'Close' : 'Chat Support'}</span>
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-28 md:bottom-20 right-4 md:right-6 z-50 w-[340px] sm:w-[380px] max-h-[540px] h-[520px] bg-[#111116] border border-[#3A321C] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#E6B92F] text-black p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <MessageSquare className="w-5 h-5 fill-black/20" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#21D39B] rounded-full ring-2 ring-[#E6B92F]" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight leading-none text-black">
                  Chat Support
                </h3>
                <span className="text-[11px] font-semibold text-black/80 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#21D39B]" /> Online
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors text-black"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#0c0c10]">
            {!conversation ? (
              /* Start Chat Form */
              <form onSubmit={handleStartChat} className="space-y-4 pt-2">
                <p className="text-xs text-[#A5A5AE]">
                  Start a conversation with our 24/7 global support team.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#181820] border border-[#282417] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E6B92F]"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181820] border border-[#282417] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E6B92F]"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A5A5AE] uppercase tracking-wider">
                    PHONE
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#181820] border border-[#282417] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E6B92F]"
                    placeholder="Enter phone with country code"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] text-black font-bold text-xs transition-colors shadow-md mt-4"
                >
                  Start chat
                </button>
              </form>
            ) : (
              /* Conversation Messages */
              <div className="space-y-3">
                {messages.map((m) => {
                  const isCustomer = m.senderRole === 'customer';
                  const dateObj = new Date(m.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          isCustomer
                            ? 'bg-[#E6B92F] text-black font-medium rounded-tr-none'
                            : 'bg-[#181820] text-zinc-200 border border-[#282417] rounded-tl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="text-[9px] text-[#A5A5AE] mt-1 px-1 flex items-center gap-1">
                        {timeFormatted}
                        {isCustomer && <CheckCheck className="w-2.5 h-2.5 text-[#21D39B]" />}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          {conversation && (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#111116] border-t border-[#282417] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#181820] border border-[#282417] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E6B92F]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-[#E6B92F] hover:bg-[#d8ab25] disabled:opacity-40 text-black flex items-center justify-center transition-colors shadow-sm shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
