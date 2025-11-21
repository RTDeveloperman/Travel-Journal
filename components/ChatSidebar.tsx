
import React, { useState, useMemo } from 'react';
import { User, ChatConversation, ChatMessageType } from '../types';
import { formatRelativeTime } from '../utils/dateUtils'; // For relative time
import clsx from 'clsx'; // For conditional classes

interface ChatSidebarProps {
  currentUser: User;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  isLoading: boolean;
  allUsers: User[]; // For searching to start new chat
  onStartNewChat: (targetUser: User) => void;
  onViewUserProfile: (user: User) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading,
  allUsers,
  onStartNewChat,
  onViewUserProfile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const getParticipantDetails = (conversation: ChatConversation): User | undefined => {
    const otherParticipantId = conversation.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === otherParticipantId);
  };
  
  const filteredUsersForNewChat = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    const usersInExistingConversations = new Set(
        conversations.flatMap(c => c.participants).filter(pId => pId !== currentUser.id)
    );

    return allUsers.filter(user => 
        user.id !== currentUser.id && 
        !usersInExistingConversations.has(user.id) && 
        (
            (user.searchableByName && 
                ((user.firstName && user.firstName.toLowerCase().includes(lowerSearchTerm)) ||
                 (user.lastName && user.lastName.toLowerCase().includes(lowerSearchTerm)))
            ) ||
            (user.username.toLowerCase().includes(lowerSearchTerm)) ||
            (user.handle && user.handle.toLowerCase().includes(lowerSearchTerm))
        )
    );
  }, [allUsers, currentUser.id, searchTerm, conversations]);

  const handleUserSearchSelect = (user: User) => {
    onStartNewChat(user);
    setSearchTerm('');
    setShowUserSearch(false);
  };

  const getLastMessageDisplay = (convo: ChatConversation): string => {
    // Prioritize explicit placeholders from chatService logic
    if (convo.lastMessageText === "[پیام حذف شد]") {
        return convo.lastMessageText;
    }
    if (convo.lastMessageText?.startsWith("FORWARD از")) {
        return convo.lastMessageText;
    }
    if (convo.lastMessageText?.startsWith("(ویرایش شده)")) {
        return convo.lastMessageText;
    }


    if (!convo.lastMessageText && convo.lastMessageTimestamp === new Date(0).toISOString()) {
      return "مکالمه جدید";
    }
    if (!convo.lastMessageText) { // Should be rare if placeholders are set
      return "هنوز پیامی ارسال نشده";
    }

    // If it's not a special placeholder, and it's a non-text type, the text should already be the placeholder
    if (convo.lastMessageType && convo.lastMessageType !== 'text') {
      return convo.lastMessageText; 
    }
    return convo.lastMessageText; // Fallback to the text itself
  };


  return (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-slate-100 border-r border-slate-300 flex flex-col h-full text-right">
      <div className="p-4 border-b border-slate-300">
        <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold text-slate-700">چت‌ها</h2>
             <button 
                onClick={() => setShowUserSearch(prev => !prev)}
                title="شروع چت جدید"
                className="p-2 text-slate-600 hover:text-sky-500 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
                <i className={clsx("fas", showUserSearch ? "fa-times" : "fa-user-plus")}></i>
            </button>
        </div>
        {showUserSearch && (
            <div className="mt-3">
                 <input
                    type="text"
                    placeholder="جستجوی کاربر برای شروع چت..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
            </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto">
        {isLoading && <div className="p-4 text-center text-sm text-slate-500">در حال بارگذاری مکالمات... <i className="fas fa-spinner fa-spin ml-1"></i></div>}
        
        {!isLoading && showUserSearch && searchTerm.trim() && (
            <div className="py-2">
                <h3 className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase">نتایج جستجو:</h3>
                {filteredUsersForNewChat.length > 0 ? (
                    filteredUsersForNewChat.map(user => (
                        <div
                            key={user.id}
                            onClick={() => handleUserSearchSelect(user)}
                            className="flex items-center p-3 hover:bg-sky-100 cursor-pointer"
                        >
                            {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full mr-3 object-cover" />
                            ) : (
                            <span className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 mr-3">
                                <i className="fas fa-user"></i>
                            </span>
                            )}
                            <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm text-slate-800 truncate">
                                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username)}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{user.handle || `@${user.username}`}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="px-4 py-2 text-xs text-slate-500">کاربری یافت نشد.</p>
                )}
                 <div className="px-4 py-2 border-t border-slate-200 mt-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-1">مکالمات موجود:</h3>
                </div>
            </div>
        )}


        {!isLoading && conversations.length === 0 && !showUserSearch && (
          <p className="p-4 text-center text-sm text-slate-500">هنوز هیچ مکالمه‌ای ندارید. یک چت جدید شروع کنید!</p>
        )}

        {!isLoading && conversations.map(convo => {
          const participant = getParticipantDetails(convo);
          if (!participant) return null; 

          const unreadCount = convo.unreadCounts[currentUser.id] || 0;
          const isActive = activeConversationId === convo.id;
          const lastMessageDisplay = getLastMessageDisplay(convo);


          return (
            <div
              key={convo.id}
              onClick={() => onSelectConversation(convo)}
              className={clsx(
                "flex items-center p-3 border-b border-slate-200 cursor-pointer",
                isActive ? "bg-sky-100" : "hover:bg-slate-200",
                unreadCount > 0 && !isActive && "font-semibold bg-sky-50" 
              )}
            >
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onViewUserProfile(participant);}} 
                className="flex-shrink-0 focus:outline-none rounded-full group/avatar"
                title={`پروفایل ${participant.handle || participant.username}`}
              >
                {participant.avatarUrl ? (
                    <img src={participant.avatarUrl} alt={participant.username} className="w-12 h-12 rounded-full object-cover group-hover/avatar:ring-2 group-hover/avatar:ring-sky-400" />
                ) : (
                    <span className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 text-xl group-hover/avatar:ring-2 group-hover/avatar:ring-sky-400">
                    <i className="fas fa-user"></i>
                    </span>
                )}
              </button>
              <div className="flex-grow min-w-0 mr-3">
                <div className="flex justify-between items-baseline">
                  <p className={clsx("text-sm truncate", isActive ? "text-sky-700 font-bold" : "text-slate-800", unreadCount > 0 && !isActive && "text-sky-600")}>
                    {participant.firstName || participant.lastName ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim() : (participant.handle || participant.username)}
                  </p>
                  <span className={clsx("text-xs flex-shrink-0", isActive ? "text-sky-600" : "text-slate-500", unreadCount > 0 && !isActive && "text-sky-500")}>
                    {convo.lastMessageTimestamp && convo.lastMessageTimestamp !== new Date(0).toISOString() ? formatRelativeTime(new Date(convo.lastMessageTimestamp)) : 'جدید'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className={clsx("text-xs text-slate-500 truncate", unreadCount > 0 && !isActive && "text-black", convo.lastMessageText === "[پیام حذف شد]" && "italic")}>
                        {convo.lastMessageSenderId === currentUser.id && convo.lastMessageText !== "[پیام حذف شد]" && <i className="fas fa-reply text-xs text-slate-400 ml-1"></i>}
                        {lastMessageDisplay}
                    </p>
                    {unreadCount > 0 && (
                        <span className="ml-2 bg-sky-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSidebar;
