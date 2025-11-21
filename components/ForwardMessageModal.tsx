

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ChatConversation, ChatMessage, ForwardMessageModalProps } from '../types'; 
import clsx from 'clsx';
import * as chatService from '../services/chatService';


const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  messageToForward,
  currentUser,
  allUsers,
  conversations,
  onConfirmForward,
  onViewUserProfile,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'conversation' | 'user' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedItemId(null);
      setSelectedItemType(null);
      setSearchTerm('');
      setIsForwarding(false);
      setError(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) onClose();
  };

  const getParticipantDetails = (conversation: ChatConversation): User | undefined => {
    const otherParticipantId = conversation.participants.find(id => id !== currentUser.id);
    return allUsers.find(u => u.id === otherParticipantId);
  };
  
  const displayableItems = useMemo(() => {
    const conversationItems = conversations.map(convo => {
        const participant = getParticipantDetails(convo);
        return {
            id: convo.id,
            type: 'conversation' as 'conversation',
            name: participant ? (participant.firstName || participant.lastName ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim() : (participant.handle || participant.username)) : 'مکالمه ناشناس',
            detail: participant ? (participant.handle || `@${participant.username}`) : '',
            avatarUrl: participant?.avatarUrl,
            participantForProfileView: participant,
        };
    });

    const existingConvoParticipantIds = new Set(conversations.flatMap(c => c.participants));
    const directUserItems = allUsers
        .filter(u => u.id !== currentUser.id && !existingConvoParticipantIds.has(u.id))
        .map(user => ({
            id: user.id,
            type: 'user' as 'user',
            name: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username),
            detail: user.handle || `@${user.username}`,
            avatarUrl: user.avatarUrl,
            participantForProfileView: user,
        }));
    
    let combined = [...conversationItems, ...directUserItems];

    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        combined = combined.filter(item => 
            item.name.toLowerCase().includes(lowerSearchTerm) ||
            item.detail.toLowerCase().includes(lowerSearchTerm)
        );
    }
    return combined.sort((a,b) => a.name.localeCompare(b.name, 'fa'));

  }, [conversations, allUsers, currentUser.id, searchTerm]);


  const handleSelect = (itemId: string, itemType: 'conversation' | 'user') => {
    setSelectedItemId(itemId);
    setSelectedItemType(itemType);
  };

  const handleForward = async () => {
    if (!selectedItemId || !selectedItemType) {
      setError("لطفاً یک مکالمه یا کاربر را برای فوروارد انتخاب کنید.");
      return;
    }
    setIsForwarding(true);
    setError(null);
    try {
      let finalTargetConversationId = selectedItemId;
      if (selectedItemType === 'user') {
        // selectedItemId is actually a targetUserId
        const targetUser = allUsers.find(u => u.id === selectedItemId);
        if (targetUser) {
            const convo = await chatService.getOrCreateConversation(currentUser.id, targetUser.id);
            finalTargetConversationId = convo.id;
        } else {
            throw new Error("کاربر مقصد برای ایجاد مکالمه یافت نشد.");
        }
      }
      await onConfirmForward(finalTargetConversationId);
      onClose();
    } catch (e: any) {
      setError(e.message || "خطا در فوروارد پیام.");
    } finally {
      setIsForwarding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forward-message-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all text-right flex flex-col max-h-[85vh]"
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 id="forward-message-title" className="text-lg font-semibold text-slate-700">
            <i className="fas fa-share ml-2 text-sky-500"></i>فوروارد پیام به...
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl focus:outline-none focus:ring-1 focus:ring-sky-400 rounded-full p-1"
            aria-label="بستن مودال فوروارد"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-4 border-b border-slate-200">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی مکالمه یا کاربر..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex-grow overflow-y-auto p-2">
          {displayableItems.length > 0 ? (
            <ul className="space-y-1">
              {displayableItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item.id, item.type)}
                    className={clsx(
                      "w-full flex items-center p-2.5 text-right rounded-md hover:bg-sky-50 focus-within:bg-sky-100 transition-colors",
                      selectedItemId === item.id ? "bg-sky-100 ring-2 ring-sky-300" : ""
                    )}
                  >
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.name} className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"/>
                    ) : (
                      <span className="w-10 h-10 rounded-full mr-3 bg-slate-200 flex items-center justify-center text-slate-400 text-lg flex-shrink-0">
                        <i className={clsx("fas", item.type === 'conversation' ? "fa-users" : "fa-user")}></i>
                      </span>
                    )}
                    <div className="flex-grow min-w-0">
                      <span className="block font-medium text-sm text-slate-700 truncate">{item.name}</span>
                      <span className="block text-xs text-slate-500 truncate">{item.detail}</span>
                    </div>
                     {item.participantForProfileView && (
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); onViewUserProfile(item.participantForProfileView!);}} 
                            className="p-1.5 text-slate-400 hover:text-sky-500 rounded-full text-xs ml-auto flex-shrink-0"
                            title={`مشاهده پروفایل ${item.name}`}
                        >
                            <i className="fas fa-info-circle"></i>
                        </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">
              {searchTerm ? "نتیجه‌ای یافت نشد." : "مکالمه یا کاربری برای انتخاب وجود ندارد."}
            </p>
          )}
        </div>
        {error && <p className="text-xs text-red-500 p-3 text-center">{error}</p>}
        <footer className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 space-x-reverse sticky bottom-0 z-10 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isForwarding}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none"
          >
            انصراف
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedItemId || isForwarding}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none disabled:opacity-50 flex items-center"
          >
            {isForwarding ? <><i className="fas fa-spinner fa-spin mr-2"></i>در حال ارسال...</> : <><i className="fas fa-paper-plane mr-2"></i>ارسال</>}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
