import React, { useState, useEffect, useRef } from 'react';
import { User, ChatConversation, ChatMessage, ChatSettings, MemoryEntry, ChronicleEvent } from '../types';
import { formatChatMessageTimestamp } from '../utils/dateUtils';
import clsx from 'clsx';
import { emojiCategories } from '../utils/emojiUtils'; // Import emojis
import GifPickerModal from './GifPickerModal'; // Import GifPickerModal
import ForwardMessageModal from './ForwardMessageModal'; // Import ForwardMessageModal
import MessageContextMenu from './MessageContextMenu'; // Import new context menu
import * as chatService from '../services/chatService';
import ShareableItemSelectionModal from './ShareableItemSelectionModal';


interface ChatWindowProps {
  currentUser: User;
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  onSendMessage: (message: Omit<ChatMessage, 'id' | 'conversationId' | 'senderId' | 'receiverId' | 'timestamp' | 'isRead' | 'isEdited' | 'isDeleted' | 'forwardedFromUserId'>) => Promise<ChatMessage | void>;
  isLoading: boolean;
  allUsers: User[]; 
  onViewUserProfile: (user: User) => void;
  conversations: ChatConversation[]; // Pass all conversations for forwarding
  refreshConversations: () => void; // To refresh sidebar after forwarding
  refreshMessages: () => void; // To refresh messages after edit/delete
  chatSettings: ChatSettings | null; // Added prop for permissions
  onViewItemFromChat: (itemId: string, type: 'memory' | 'chronicle') => void;
  userMemories: MemoryEntry[];
  userChronicleEvents: ChronicleEvent[];
  onSendSharedItem: (itemId: string, itemTitle: string, itemType: 'memory' | 'chronicle') => Promise<void>;
}

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  activeConversation,
  messages,
  onSendMessage,
  isLoading,
  allUsers,
  onViewUserProfile,
  conversations,
  refreshConversations,
  refreshMessages,
  chatSettings,
  onViewItemFromChat,
  userMemories,
  userChronicleEvents,
  onSendSharedItem,
}) => {
  const [newMessageText, setNewMessageText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: ChatMessage; } | null>(null);

  // States for message actions
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if(activeConversation) {
        messageInputRef.current?.focus();
        setShowEmojiPicker(false); 
        setShowAttachmentMenu(false);
        setEditingMessage(null);
        setReplyingToMessage(null);
        setContextMenu(null); // Close context menu on conversation change
    }
  }, [activeConversation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Logic for closing attachment/emoji menus remains the same
      const target = event.target as Node;
      if (showAttachmentMenu && attachmentButtonRef.current && !attachmentButtonRef.current.contains(target)) {
        const menuElement = document.getElementById('attachment-menu-items'); 
        if (menuElement && !menuElement.contains(target)) {
          setShowAttachmentMenu(false);
        }
      }
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target) && emojiButtonRef.current && !emojiButtonRef.current.contains(target)) {
         setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu, showEmojiPicker]);


  const handleSubmitText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() && !replyingToMessage?.fileUrl) { 
        if (!replyingToMessage || replyingToMessage.type === 'text') return;
    }


    const payload: Omit<ChatMessage, 'id' | 'conversationId' | 'senderId' | 'receiverId' | 'timestamp' | 'isRead' | 'isEdited' | 'isDeleted' | 'forwardedFromUserId'> = {
        type: 'text',
        text: newMessageText.trim(),
    };

    if (replyingToMessage) {
        payload.originalMessageId = replyingToMessage.id;
        payload.originalMessageText = replyingToMessage.text || (replyingToMessage.type !== 'text' ? `[${replyingToMessage.type}]` : '');
        payload.originalMessageSenderId = replyingToMessage.senderId;
    }
    await onSendMessage(payload);
    setNewMessageText('');
    setReplyingToMessage(null);
  };

  const handleFileUpload = (file: File, type: 'image' | 'file') => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      alert("حجم فایل نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onSendMessage({ type, fileUrl: reader.result as string, fileName: file.name, fileType: file.type, fileSize: file.size });
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };
  
  const triggerFileInput = (acceptType: 'image/*' | '*') => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = acceptType;
        fileInputRef.current.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files[0]) {
                handleFileUpload(files[0], acceptType === 'image/*' ? 'image' : 'file');
            }
            if(fileInputRef.current) fileInputRef.current.onchange = null; 
        };
        fileInputRef.current.click();
    }
  };
  
  const handleGifSelect = (gifUrl: string) => {
    onSendMessage({ type: 'gif', fileUrl: gifUrl, fileName: 'selected.gif', fileType: 'image/gif' });
    setShowGifPicker(false);
    setShowAttachmentMenu(false);
  };
  
  const handleShareItemSelect = async (itemId: string, itemTitle: string, itemType: 'memory' | 'chronicle') => {
    await onSendSharedItem(itemId, itemTitle, itemType);
    setIsShareModalOpen(false);
    setShowAttachmentMenu(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    setNewMessageText(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  const handleContextMenu = (event: React.MouseEvent, message: ChatMessage) => {
    event.preventDefault();
    if (editingMessage?.id === message.id) return; // Don't show menu for message being edited
    setContextMenu({ x: event.clientX, y: event.clientY, message });
  };

  // --- Action Handlers (called from context menu or double-click) ---
  const handleReplyAction = (message: ChatMessage) => {
    if (!message || message.isDeleted) return;
    setReplyingToMessage(message);
    setContextMenu(null); // Close context menu
    messageInputRef.current?.focus();
  };
  
  const handleForwardAction = (message: ChatMessage) => {
    if (!message || message.isDeleted || !chatSettings?.allowForward) return;
    setMessageToForward(message);
    setShowForwardModal(true);
    setContextMenu(null); // Close context menu
  };
  
  const handleEditAction = (message: ChatMessage) => {
    if (!message || message.type !== 'text' || message.senderId !== currentUser.id || message.isDeleted || !chatSettings?.allowEdit) return;
    setEditingMessage(message);
    setEditText(message.text || '');
    setContextMenu(null); // Close context menu
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !editText.trim()) return;
    setActionError(null);
    try {
      await chatService.editMessageInConversation(editingMessage.conversationId, editingMessage.id, editText.trim(), currentUser.id);
      setEditingMessage(null);
      setEditText('');
      refreshMessages(); 
      refreshConversations();
    } catch (err: any) {
      setActionError("خطا در ویرایش پیام: " + err.message);
    }
  };

  const handleDeleteAction = async (message: ChatMessage) => {
    if (!message || message.senderId !== currentUser.id || message.isDeleted || !chatSettings?.allowDelete) return;
    if (!window.confirm("آیا از حذف این پیام مطمئن هستید؟ این عمل قابل بازگشت نیست.")) return;
    setActionError(null);
    try {
      await chatService.deleteMessageInConversation(message.conversationId, message.id, currentUser.id);
      refreshMessages();
      refreshConversations();
    } catch (err: any) {
      setActionError("خطا در حذف پیام: " + err.message);
    } finally {
        setContextMenu(null);
    }
  };

  const handleConfirmForward = async (targetConversationId: string) => {
    if (!messageToForward) return;
    setActionError(null);
    try {
      await chatService.forwardMessageToConversation(messageToForward.id, targetConversationId, currentUser.id, allUsers);
      setShowForwardModal(false);
      setMessageToForward(null);
      refreshConversations(); 
      if (targetConversationId === activeConversation?.id) {
          refreshMessages();
      }
      alert("پیام با موفقیت فوروارد شد.");
    } catch (err: any) {
      setActionError("خطا در فوروارد پیام: " + err.message);
    }
  };


  if (!activeConversation) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full bg-white p-6 text-center">
        <i className="fas fa-comments text-6xl text-slate-300 mb-4"></i>
        <p className="text-slate-500 text-lg">یک مکالمه را از لیست کنار انتخاب کنید</p>
        <p className="text-slate-400 text-sm">یا یک چت جدید با یکی از کاربران شروع کنید.</p>
      </div>
    );
  }

  const otherParticipantId = activeConversation.participants.find(id => id !== currentUser.id);
  const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
  const participantDisplayName = otherParticipant 
    ? (otherParticipant.firstName || otherParticipant.lastName 
        ? `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() 
        : (otherParticipant.handle || otherParticipant.username))
    : "کاربر";

  return (
    <div className="flex-grow flex flex-col h-full bg-white text-right">
      <header className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between relative z-20">
        {otherParticipant ? (
            <button 
                type="button" 
                onClick={() => onViewUserProfile(otherParticipant)} 
                className="flex items-center group focus:outline-none"
                title={`پروفایل ${participantDisplayName}`}
            >
                {otherParticipant.avatarUrl ? (
                    <img src={otherParticipant.avatarUrl} alt={participantDisplayName} className="w-10 h-10 rounded-full mr-3 object-cover group-hover:ring-2 group-hover:ring-sky-400" />
                ) : (
                    <span className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 mr-3 text-lg group-hover:ring-2 group-hover:ring-sky-400">
                        <i className="fas fa-user"></i>
                    </span>
                )}
                <h2 className="text-md font-semibold text-slate-700 group-hover:text-sky-600 group-hover:underline">
                    {participantDisplayName}
                </h2>
          </button>
        ) : (
            <h2 className="text-md font-semibold text-slate-700">چت</h2>
        )}
      </header>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-slate-50 relative" ref={messagesContainerRef}>
         {contextMenu && chatSettings && (
            <MessageContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                message={contextMenu.message}
                currentUser={currentUser}
                chatSettings={chatSettings}
                onClose={() => setContextMenu(null)}
                onReply={handleReplyAction}
                onForward={handleForwardAction}
                onEdit={handleEditAction}
                onDelete={handleDeleteAction}
            />
        )}
        {isLoading && <div className="text-center text-sm text-slate-500 py-4">در حال بارگذاری پیام‌ها... <i className="fas fa-spinner fa-spin ml-1"></i></div>}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-4">هنوز پیامی در این مکالمه وجود ندارد. اولین پیام را ارسال کنید!</p>
        )}
        {messages.map((msg, index) => {
          const isCurrentUserSender = msg.senderId === currentUser.id;
          const prevMessage = messages[index-1];
          let showTimestamp = index === 0 || (prevMessage && new Date(msg.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 5 * 60 * 1000);

          if (msg.isDeleted) {
            if(prevMessage && prevMessage.isDeleted && prevMessage.senderId === msg.senderId && !showTimestamp) {
            } else if (!prevMessage || prevMessage.senderId !== msg.senderId || !prevMessage.isDeleted) {
                showTimestamp = true; 
            }
          } else if (prevMessage && prevMessage.isDeleted) {
            showTimestamp = true; 
          }
                                
          const originalSenderForReply = msg.originalMessageSenderId ? allUsers.find(u => u.id === msg.originalMessageSenderId) : null;
          const originalSenderNameForReply = originalSenderForReply ? (originalSenderForReply.firstName || originalSenderForReply.username) : 'کاربر';
          const forwardedFromUser = msg.forwardedFromUserId ? allUsers.find(u => u.id === msg.forwardedFromUserId) : null;
          const forwardedFromName = forwardedFromUser ? (forwardedFromUser.handle || forwardedFromUser.username) : 'کاربر ناشناس';

          if (editingMessage?.id === msg.id) {
            return (
              <form key={`edit-${msg.id}`} onSubmit={handleEditSubmit} className={clsx("flex my-2", isCurrentUserSender ? "justify-start" : "justify-end")}>
                <div className="p-2 rounded-lg shadow-md bg-yellow-50 border border-yellow-300 w-full max-w-md">
                    <p className="text-xs text-yellow-700 mb-1">ویرایش پیام:</p>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none" rows={2} autoFocus />
                    <div className="flex justify-start space-x-2 space-x-reverse mt-2">
                        <button type="submit" className="px-3 py-1 text-xs bg-sky-500 text-white rounded hover:bg-sky-600">ذخیره</button>
                        <button type="button" onClick={() => setEditingMessage(null)} className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300">لغو</button>
                    </div>
                </div>
              </form>
            );
          }

          return (
            <React.Fragment key={msg.id}>
              {showTimestamp && (
                <div className="text-center my-3"><span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{formatChatMessageTimestamp(msg.timestamp)}</span></div>
              )}
              
              <div 
                className={clsx("flex group message-bubble-container relative", isCurrentUserSender ? "justify-start" : "justify-end")}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onDoubleClick={() => handleReplyAction(msg)}
              >
                <div className={clsx( "max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow relative transition-colors duration-200 cursor-pointer", isCurrentUserSender ? "chat-bubble-sent" : "chat-bubble-received", msg.isDeleted && "bg-slate-200 text-slate-500 italic")}>
                  {actionError && contextMenu?.message.id === msg.id && ( <p className="text-xs text-red-500 mb-1">{actionError}</p> )}
                  
                  {msg.forwardedFromUserId && !msg.isDeleted && ( <p className="text-xs text-slate-500 mb-1 opacity-80"><i className="fas fa-share ml-1"></i>فوروارد شده از {forwardedFromName}</p> )}
                  {msg.originalMessageId && !msg.isDeleted && (
                    <div className="mb-1 p-2 border-r-2 border-slate-400 bg-black bg-opacity-[0.03] rounded-sm">
                        <p className="text-xs font-semibold text-slate-600">در پاسخ به {msg.originalMessageSenderId === currentUser.id ? 'خودتان' : originalSenderNameForReply}:</p>
                        <p className="text-xs text-slate-500 truncate italic">{msg.originalMessageText || (msg.type === 'text' ? "[پیام اصلی]" : `[${msg.type} اصلی]`)}</p>
                    </div>
                  )}

                  {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                  {(msg.type === 'image' || msg.type === 'gif') && msg.fileUrl && !msg.isDeleted && ( <img src={msg.fileUrl} alt={msg.fileName || msg.type} className="max-w-full h-auto rounded-md object-contain max-h-60" /> )}
                  {msg.type === 'file' && msg.fileUrl && !msg.isDeleted && (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 space-x-reverse p-2 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors group">
                      <i className={clsx("fas text-2xl", msg.fileType?.startsWith('image/') ? 'fa-file-image text-purple-500' : msg.fileType === 'application/pdf' ? 'fa-file-pdf text-red-500' : msg.fileType?.startsWith('audio/') ? 'fa-file-audio text-blue-500' : msg.fileType?.startsWith('video/') ? 'fa-file-video text-orange-500' : 'fa-file-alt text-slate-500')}></i>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{msg.fileName || 'دانلود فایل'}</p>
                        <p className="text-xs text-slate-500 group-hover:text-slate-700">{formatFileSize(msg.fileSize)}{msg.fileType && ` (${msg.fileType.split('/')[1] || msg.fileType})`}</p>
                      </div>
                       <i className="fas fa-download text-slate-400 group-hover:text-slate-600 mr-auto"></i>
                    </a>
                  )}
                  {msg.type === 'memory' && msg.linkedItemId && !msg.isDeleted && (
                    <div className="p-2 bg-sky-50 rounded-lg border-r-4 border-sky-400">
                      <p className="text-xs text-sky-700 mb-1"><i className="fas fa-route mr-1.5"></i>خاطره سفر</p>
                      <p className="font-semibold text-slate-800 break-words">{msg.linkedItemTitle}</p>
                      <button onClick={() => onViewItemFromChat(msg.linkedItemId!, 'memory')} className="mt-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 px-3 py-1 rounded-md transition-colors">
                        مشاهده جزئیات
                      </button>
                    </div>
                  )}
                  {msg.type === 'chronicle' && msg.linkedItemId && !msg.isDeleted && (
                    <div className="p-2 bg-emerald-50 rounded-lg border-r-4 border-emerald-400">
                      <p className="text-xs text-emerald-800 mb-1"><i className="fas fa-calendar-day mr-1.5"></i>رویداد روزنگار</p>
                      <p className="font-semibold text-slate-800 break-words">{msg.linkedItemTitle}</p>
                      <button onClick={() => onViewItemFromChat(msg.linkedItemId!, 'chronicle')} className="mt-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors">
                        مشاهده جزئیات
                      </button>
                    </div>
                  )}
                   <div className="text-xs opacity-70 mt-0.5" style={{fontSize: '0.65rem', lineHeight: '0.8rem'}}>
                        {msg.isEdited && !msg.isDeleted && <span className="italic mr-1">(ویرایش شده)</span>}
                        {isCurrentUserSender && msg.isRead && index === messages.length -1 && !msg.isDeleted && msg.type === 'text' && ( <i className="fas fa-check-double text-blue-400 float-left clear-both" title="خوانده شده"></i> )}
                   </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-3 border-t border-slate-200 bg-slate-100 relative">
        {replyingToMessage && (
            <div className="reply-context-preview bg-slate-200 p-2 mb-2 rounded-md border-r-2 border-sky-500">
                <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600">پاسخ به: <span className="font-semibold">{replyingToMessage.senderId === currentUser.id ? 'خودتان' : (allUsers.find(u=>u.id === replyingToMessage.senderId)?.firstName || 'کاربر')}</span></p>
                    <button onClick={() => setReplyingToMessage(null)} className="text-xs text-slate-500 hover:text-red-500"><i className="fas fa-times"></i></button>
                </div>
                <p className="text-xs text-slate-500 italic truncate">{replyingToMessage.text || (replyingToMessage.type !== 'text' ? `[${replyingToMessage.type}]` : '')}</p>
            </div>
        )}
        {showAttachmentMenu && (
          <div id="attachment-menu-items" className="absolute bottom-full right-3 mb-1 w-52 bg-white border border-slate-300 rounded-lg shadow-xl z-20 py-1">
            <button onClick={() => { triggerFileInput('image/*'); setShowAttachmentMenu(false); }} className="attachment-menu-item"><i className="fas fa-image mr-2"></i>ارسال تصویر</button>
            <button onClick={() => { triggerFileInput('*'); setShowAttachmentMenu(false); }} className="attachment-menu-item"><i className="fas fa-paperclip mr-2"></i>ارسال فایل</button>
            <button onClick={() => { setShowGifPicker(true); setShowAttachmentMenu(false); }} className="attachment-menu-item"><i className="fas fa-photo-video mr-2"></i>انتخاب گیف</button>
            <div className="border-t my-1 border-slate-200"></div>
            <button onClick={() => { setIsShareModalOpen(true); setShowAttachmentMenu(false); }} className="attachment-menu-item"><i className="fas fa-book-medical mr-2 text-purple-500"></i>ارسال خاطره یا رویداد</button>
          </div>
        )}
        {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-3 mb-1 w-72 h-80 bg-white border border-slate-300 rounded-lg shadow-xl z-20 flex flex-col p-2">
                <div className="text-sm font-semibold text-slate-700 mb-2 px-1 text-center">انتخاب اموجی</div>
                <div className="flex-grow overflow-y-auto emoji-picker-grid">
                    {emojiCategories.map(category => (
                        <div key={category.name} className="mb-2 emoji-picker-category">
                            <h4 className="text-xs text-slate-500 font-semibold mb-1 px-1">{category.name}</h4>
                            <div className="grid grid-cols-8 gap-1">
                                {category.emojis.map(emoji => ( <button key={emoji} onClick={() => handleInsertEmoji(emoji)} className="text-xl p-1 hover:bg-slate-200 rounded-md transition-colors" title={emoji}>{emoji}</button>))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
         <input type="file" ref={fileInputRef} style={{ display: 'none' }} />

        <form onSubmit={handleSubmitText} className="flex items-center space-x-2 space-x-reverse">
          <button ref={attachmentButtonRef} type="button" onClick={() => { setShowAttachmentMenu(prev => !prev); setShowEmojiPicker(false); }} className="p-2.5 text-slate-500 hover:text-sky-500 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-50" aria-label="افزودن پیوست" disabled={!chatSettings?.allowFileUpload}><i className={clsx("fas", showAttachmentMenu ? "fa-times" : "fa-plus")}></i></button>
          <button ref={emojiButtonRef} type="button" onClick={() => { setShowEmojiPicker(prev => !prev); setShowAttachmentMenu(false); }} className="p-2.5 text-slate-500 hover:text-yellow-500 rounded-full focus:outline-none focus:ring-1 focus:ring-yellow-400" aria-label="درج اموجی"><i className={clsx("fas", showEmojiPicker ? "fa-times-circle" : "fa-smile")}></i></button>
          <textarea ref={messageInputRef} value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder="پیام خود را بنویسید..." rows={1} className="flex-grow p-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitText(e); }}} />
          <button type="submit" disabled={!newMessageText.trim() && !replyingToMessage?.fileUrl} className="p-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50" aria-label="ارسال پیام"><i className="fas fa-paper-plane"></i></button>
        </form>
        {!chatSettings?.allowFileUpload && (
            <p className="text-xs text-slate-500 text-center mt-1">ارسال فایل و تصویر توسط مدیر غیرفعال شده است.</p>
        )}
      </footer>
      {showGifPicker && ( <GifPickerModal isOpen={showGifPicker} onClose={() => setShowGifPicker(false)} onGifSelect={handleGifSelect} /> )}
      {showForwardModal && messageToForward && ( <ForwardMessageModal isOpen={showForwardModal} onClose={() => {setShowForwardModal(false); setMessageToForward(null);}} messageToForward={messageToForward} currentUser={currentUser} allUsers={allUsers} conversations={conversations} onConfirmForward={handleConfirmForward} onViewUserProfile={onViewUserProfile} /> )}
      
      {isShareModalOpen && (
        <ShareableItemSelectionModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            onSelectItem={handleShareItemSelect}
            memories={userMemories}
            chronicles={userChronicleEvents}
        />
      )}
    </div>
  );
};

export default ChatWindow;