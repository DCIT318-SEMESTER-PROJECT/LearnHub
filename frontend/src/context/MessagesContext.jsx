import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getUnreadCount } from '../api/messagesAPI';
import { useAuth } from './AuthContext';

const MessagesContext = createContext();

export function MessagesProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [openChatUserId, setOpenChatUserId] = useState(null);
  const [openChatUserMeta, setOpenChatUserMeta] = useState(null);
  const pollRef = useRef(null);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      // Silent — the badge just won't update
    }
  }, [user]);

  useEffect(() => {
    refreshUnread();
    // Poll every 15s
    pollRef.current = setInterval(refreshUnread, 15000);
    return () => clearInterval(pollRef.current);
  }, [refreshUnread]);

  // Open a chat with a user. `meta` is optional { firstName, lastName, avatarUrl }
  const openChat = (userId, meta = null) => {
    setOpenChatUserId(userId);
    setOpenChatUserMeta(meta);
  };

  const closeChat = () => {
    setOpenChatUserId(null);
    setOpenChatUserMeta(null);
  };

  return (
    <MessagesContext.Provider
      value={{
        unreadCount,
        refreshUnread,
        openChatUserId,
        openChatUserMeta,
        openChat,
        closeChat,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}