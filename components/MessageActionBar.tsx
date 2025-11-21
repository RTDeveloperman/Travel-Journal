
import React from 'react';
import { ChatMessage, User } from '../types';

interface MessageActionBarProps {
  selectedMessage: ChatMessage;
  currentUser: User;
  onReply: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}

const ActionButton: React.FC<{ icon: string; label: string; onClick: () => void; className?: string; }> = ({ icon, label, onClick, className = '' }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors text-slate-600 hover:bg-slate-200 hover:text-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-500 ${className}`}
    aria-label={label}
    title={label}
  >
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const MessageActionBar: React.FC<MessageActionBarProps> = ({
  selectedMessage,
  currentUser,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onDeselect,
}) => {
  const canEditOrDelete = selectedMessage.senderId === currentUser.id && !selectedMessage.isDeleted;
  const canReplyOrForward = !selectedMessage.isDeleted;

  return (
    <div className="message-action-bar absolute top-0 left-0 right-0 bg-white bg-opacity-95 shadow-lg border-b border-slate-200 z-10 p-2 transform transition-transform duration-200 ease-in-out">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex space-x-2 space-x-reverse">
          {canReplyOrForward && <ActionButton icon="fa-reply" label="ریپلای" onClick={onReply} />}
          {canReplyOrForward && <ActionButton icon="fa-share" label="فوروارد" onClick={onForward} />}
          {canEditOrDelete && selectedMessage.type === 'text' && <ActionButton icon="fa-edit" label="ویرایش" onClick={onEdit} />}
          {canEditOrDelete && <ActionButton icon="fa-trash-alt" label="حذف" onClick={onDelete} className="hover:text-red-600" />}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDeselect(); }}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-400"
          aria-label="بستن"
          title="لغو انتخاب"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default MessageActionBar;
