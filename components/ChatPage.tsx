


import React, { useState, useEffect, useCallback } from 'react';
import { User, ChatConversation, ChatMessage, ChatSettings, MemoryEntry, ChronicleEvent } from '../types';
import * as chatService from '../services/chatService';
import * as dataService from '../services/dataService';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

interface ChatPageProps {
  currentUser: User;
  allUsers: User[]; // All users available for starting new chats (excluding current user and admin)
  initialTargetUserId: string | null; // For opening a chat directly
  clearInitialTargetUser: () => void; // To clear the initial target after use
  onViewUserProfile: (user: User) => void;
  onViewItemFromChat: (itemId: string, type: 'memory' | 'chronicle') => void;
  userMemories: MemoryEntry[];
  userChronicleEvents: ChronicleEvent[];
}

const ChatPage: React.FC<ChatPageProps> = ({ 
    currentUser, 
    allUsers, 
    initialTargetUserId, 
    clearInitialTargetUser,
    onViewUserProfile,
    onViewItemFromChat,
    userMemories,
    userChronicleEvents
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);

  const fetchConversations = useCallback(async () => {
    // setIsLoadingConversations(true); // Let's not show loading spinner on every poll
    setChatError(null);
    try {
      const convos = await chatService.fetchUserConversationsList(currentUser.id);
      setConversations(convos);
    } catch (error: any) {
      setChatError("خطا در بارگذاری لیست مکالمات: " + error.message);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchConversations();
    // Set up polling for conversations (simple version)
    const intervalId: ReturnType<typeof setInterval> = setInterval(fetchConversations, 15000); // Poll every 15 seconds
    return () => clearInterval(intervalId);
  }, [fetchConversations]);
  
  // Fetch chat settings for the current user
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const settings = await chatService.getChatSettingsForUser(currentUser.id);
            setChatSettings(settings);
        } catch (error: any) {
            setChatError("خطا در بارگذاری تنظیمات چت: " + error.message);
        }
    };
    fetchSettings();
  }, [currentUser.id]);

  const fetchActiveConversationMessages = useCallback(async () => {
    if (!activeConversation) return;
    setIsLoadingMessages(true);
    setChatError(null);
    try {
      const fetchedMessages = await chatService.fetchMessagesForConversation(activeConversation.id);
      setMessages(fetchedMessages);
      await chatService.markConversationAsRead(activeConversation.id, currentUser.id);
      fetchConversations(); // Refresh sidebar unread counts
    } catch (error: any) {
      setChatError("خطا در بارگذاری پیام‌ها: " + error.message);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversation, currentUser.id, fetchConversations]);


  useEffect(() => {
    // If there's an initial target user, try to open that chat
    if (initialTargetUserId && (conversations.length > 0 || !isLoadingConversations)) { // ensure convos are loaded or tried
      const targetConvo = conversations.find(c => c.participants.includes(initialTargetUserId));
      if (targetConvo) {
        handleSelectConversation(targetConvo);
      } else {
        // If no existing conversation, try to create one
        const targetUser = allUsers.find(u => u.id === initialTargetUserId);
        if (targetUser) {
           handleStartNewChat(targetUser);
        }
      }
      clearInitialTargetUser(); // Clear after attempting to use it
    }
  }, [initialTargetUserId, conversations, allUsers, clearInitialTargetUser, isLoadingConversations]);

  useEffect(() => {
    if(activeConversation) {
        fetchActiveConversationMessages();
    }
  }, [activeConversation?.id, fetchActiveConversationMessages]);


  const handleSelectConversation = useCallback(async (conversation: ChatConversation) => {
    setActiveConversation(null); // Clear previous active convo messages
    setMessages([]);
    // Use a timeout to ensure state update propagates before fetching new messages
    setTimeout(() => {
        setActiveConversation(conversation);
    },0);
  }, []);

  const handleSendMessage = async (
    messagePayload: Omit<ChatMessage, 'id' | 'conversationId' | 'senderId' | 'receiverId' | 'timestamp' | 'isRead' | 'isEdited' | 'isDeleted' | 'forwardedFromUserId'>
  ): Promise<ChatMessage | void> => {
    if (!activeConversation) return;
    if (messagePayload.type === 'text' && (!messagePayload.text || !messagePayload.text.trim()) && !messagePayload.originalMessageId) {
       if (!messagePayload.fileUrl) return; 
    }

    setChatError(null);
    
    const receiverId = activeConversation.participants.find(pId => pId !== currentUser.id);
    if (!receiverId) {
        setChatError("گیرنده پیام در این مکالمه مشخص نیست.");
        return;
    }

    try {
      const newMessage = await chatService.sendMessageToConversation(
        activeConversation.id,
        currentUser.id,
        receiverId,
        messagePayload 
      );
      setMessages(prev => [...prev, newMessage]);
       setActiveConversation(prevConvo => prevConvo ? {
            ...prevConvo,
            lastMessageText: newMessage.isDeleted ? "[پیام حذف شد]" : 
                             newMessage.forwardedFromUserId ? `FORWARD از ${newMessage.text || newMessage.type}` :
                             newMessage.type === 'text' ? newMessage.text : 
                             newMessage.type === 'memory' ? `🗺️ خاطره: ${newMessage.linkedItemTitle}` :
                             newMessage.type === 'chronicle' ? `🗓️ روزنگار: ${newMessage.linkedItemTitle}` :
                             (newMessage.type === 'image' ? '📷 تصویر' : 
                             (newMessage.type === 'gif' ? '🖼️ گیف' : `📎 فایل: ${newMessage.fileName || 'فایل'}`)),
            lastMessageType: newMessage.type,
            lastMessageTimestamp: newMessage.timestamp,
            lastMessageSenderId: newMessage.senderId,
        } : null);
      fetchConversations(); 
      return newMessage;
    } catch (error: any) {
      setChatError("خطا در ارسال پیام: " + error.message);
    }
  };
  
  const handleStartNewChat = async (targetUser: User) => {
    setChatError(null);
    try {
        const conversation = await chatService.getOrCreateConversation(currentUser.id, targetUser.id);
        const existingConvo = conversations.find(c => c.id === conversation.id);
        if (!existingConvo) {
            setConversations(prev => [conversation, ...prev]
                .sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime())
            );
        }
        handleSelectConversation(conversation);
    } catch (error: any) {
        setChatError("خطا در شروع چت جدید: " + error.message);
    }
  };

  const handleSendSharedItem = async (itemId: string, itemTitle: string, itemType: 'memory' | 'chronicle') => {
    if (!activeConversation) return;
    const receiver = allUsers.find(u => u.id === activeConversation.participants.find(pId => pId !== currentUser.id));
    if (!receiver) {
      setChatError("گیرنده برای اشتراک گذاری یافت نشد.");
      return;
    }
    
    try {
      await dataService.shareItem(itemId, itemType, receiver.id, receiver.username, currentUser.id, receiver.handle, receiver.avatarUrl, receiver.firstName, receiver.lastName);
      await handleSendMessage({ type: itemType, linkedItemId: itemId, linkedItemTitle: itemTitle, text: `یک ${itemType === 'memory' ? 'خاطره' : 'رویداد'} برای شما فرستاد.` });
    } catch (e: any) {
      setChatError("خطا در اشتراک گذاری آیتم: " + e.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] max-h-[700px] bg-white shadow-xl rounded-lg mt-2"> 
      <ChatSidebar
        currentUser={currentUser}
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        isLoading={isLoadingConversations}
        allUsers={allUsers}
        onStartNewChat={handleStartNewChat}
        onViewUserProfile={onViewUserProfile}
      />
      <ChatWindow
        currentUser={currentUser}
        activeConversation={activeConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoadingMessages}
        allUsers={allUsers}
        onViewUserProfile={onViewUserProfile}
        conversations={conversations} // For ForwardMessageModal
        refreshConversations={fetchConversations} // For ForwardMessageModal
        refreshMessages={fetchActiveConversationMessages} // For edit/delete
        chatSettings={chatSettings} // Pass settings down
        onViewItemFromChat={onViewItemFromChat}
        userMemories={userMemories}
        userChronicleEvents={userChronicleEvents}
        onSendSharedItem={handleSendSharedItem}
      />
      {chatError && <p className="text-red-500 text-xs p-2 absolute bottom-0 right-0">{chatError}</p>}
    </div>
  );
};

export default ChatPage;