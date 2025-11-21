import React, { useEffect, useRef } from 'react';
import { ChatMessage, User, ChatSettings } from '../types';

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: ChatMessage;
  currentUser: User;
  chatSettings: ChatSettings;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ x, y, message, currentUser, chatSettings, onClose, onReply, onForward, onEdit, onDelete }) => {
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Combine ownership/message state checks with admin-defined permissions
  const canEdit = message.senderId === currentUser.id && !message.isDeleted && message.type === 'text' && chatSettings.allowEdit;
  const canDelete = message.senderId === currentUser.id && !message.isDeleted && chatSettings.allowDelete;
  const canForward = !message.isDeleted && chatSettings.allowForward;
  const canReply = !message.isDeleted; // Reply is not a configurable setting

  const menuStyle: React.CSSProperties = {
    top: `${y}px`,
    left: `${x}px`,
    position: 'fixed', // Use fixed positioning to place relative to viewport
    transform: 'translateX(-100%)', // Open to the left of the cursor
  };
  
  // Adjust position if it would go off-screen
  if (menuRef.current) {
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    if (x - menuWidth < 0) {
      menuStyle.left = `${x}px`; // Open to the right if no space on left
      menuStyle.transform = 'translateX(0)';
    }
    if (y + menuHeight > window.innerHeight) {
        menuStyle.top = `${y - menuHeight}px`; // Open above if no space below
    }
  }


  return (
    <ul ref={menuRef} style={menuStyle} className="bg-white shadow-xl rounded-md py-1 z-30 w-48 text-right">
      {canReply && (
        <li onClick={() => { onReply(message); onClose(); }} className="px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-sky-700 cursor-pointer flex items-center justify-end">
          <span className="mr-3">ریپلای</span>
          <i className="fas fa-reply w-4 text-center"></i>
        </li>
      )}
      {canForward && (
        <li onClick={() => { onForward(message); onClose(); }} className="px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-sky-700 cursor-pointer flex items-center justify-end">
          <span className="mr-3">فوروارد</span>
          <i className="fas fa-share w-4 text-center"></i>
        </li>
      )}
      {canEdit && (
        <li onClick={() => { onEdit(message); onClose(); }} className="px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-sky-700 cursor-pointer flex items-center justify-end">
          <span className="mr-3">ویرایش</span>
          <i className="fas fa-edit w-4 text-center"></i>
        </li>
      )}
      {canDelete && (
        <li onClick={() => { onDelete(message); onClose(); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center justify-end">
          <span className="mr-3">حذف</span>
          <i className="fas fa-trash-alt w-4 text-center"></i>
        </li>
      )}
    </ul>
  );
};

export default MessageContextMenu;