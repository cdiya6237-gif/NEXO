import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';
import { User, ChatMessage } from '../../types';
import { store } from '../../services/store';

interface CustomerMessageNotificationProps {
  currentUser: User | null;
  onOpenChat: () => void;
  isChatOpen: boolean;
}

export const CustomerMessageNotification: React.FC<CustomerMessageNotificationProps> = ({
  currentUser,
  onOpenChat,
  isChatOpen,
}) => {
  const [activeNotification, setActiveNotification] = useState<ChatMessage | null>(null);
  const lastProcessedMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize with latest existing support message ID so we only alert for NEW incoming messages
    const convs = store.getConversations();
    const myConv = currentUser
      ? convs.find(c => c.userId === currentUser.id || c.customerEmail === currentUser.email)
      : convs[0];

    if (myConv) {
      const msgs = store.getMessages(myConv.id);
      const latestSupportMsg = msgs.filter(m => m.senderRole === 'support').slice(-1)[0];
      if (latestSupportMsg) {
        lastProcessedMsgIdRef.current = latestSupportMsg.id;
      }
    }

    const checkForNewMessages = (e?: Event) => {
      const customEvent = e as CustomEvent;
      const key = customEvent?.detail?.key;
      if (key && !['chat_messages', 'chat_conversations', 'server_sync', 'broadcast'].includes(key)) {
        return;
      }

      const currentConvs = store.getConversations();
      const currentConv = currentUser
        ? currentConvs.find(c => c.userId === currentUser.id || c.customerEmail === currentUser.email)
        : currentConvs[0];

      if (!currentConv) return;

      const msgs = store.getMessages(currentConv.id);
      const supportMsgs = msgs.filter(m => m.senderRole === 'support');
      const latest = supportMsgs.slice(-1)[0];

      if (latest && latest.id !== lastProcessedMsgIdRef.current) {
        lastProcessedMsgIdRef.current = latest.id;

        // If customer is already viewing chat, do not show duplicate intrusive notification
        if (!isChatOpen) {
          setActiveNotification(latest);
        }
      }
    };

    window.addEventListener('nexo_storage_change', checkForNewMessages);
    const interval = setInterval(checkForNewMessages, 2500);

    return () => {
      window.removeEventListener('nexo_storage_change', checkForNewMessages);
      clearInterval(interval);
    };
  }, [currentUser?.id, isChatOpen]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  if (!activeNotification || isChatOpen) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div
        onClick={() => {
          setActiveNotification(null);
          onOpenChat();
        }}
        className="bg-[#14141c]/95 border-2 border-[#E6B92F] backdrop-blur-md rounded-2xl p-3.5 shadow-[0_8px_30px_rgba(230,185,47,0.35)] flex items-start gap-3 cursor-pointer hover:bg-[#181824] transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6B92F] to-[#b38814] flex items-center justify-center text-black font-extrabold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <MessageSquare className="w-5 h-5 fill-black/20" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold text-[#E6B92F] flex items-center gap-1.5 truncate">
              <span>{activeNotification.senderName || 'NEXO Support Team'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#21D39B] animate-pulse" />
            </span>
            <span className="text-[10px] text-[#A5A5AE] font-mono shrink-0">
              Just now
            </span>
          </div>

          <p className="text-xs text-white line-clamp-2 leading-relaxed">
            {activeNotification.message}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#E6B92F] group-hover:translate-x-1 transition-transform">
            <span>Open Support Chat & Reply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveNotification(null);
          }}
          className="text-[#A5A5AE] hover:text-white p-1 rounded-lg hover:bg-[#1f1f2c] transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
