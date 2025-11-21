
import React from 'react';
import { ChronicleEvent, User } from '../types'; // Added User
import { formatDateTimeForDisplay } from '../utils/dateUtils';

interface ChronicleEventCardProps {
  event: ChronicleEvent;
  onEdit: (event: ChronicleEvent) => void;
  onDelete: (eventId: string) => void;
  isLoading?: boolean;
  currentUser: User; // Added
  onShare: (id: string, title: string, type: 'memory' | 'chronicle', ownerUserId: string) => void; // Added
}

const ChronicleEventCard: React.FC<ChronicleEventCardProps> = ({ event, onEdit, onDelete, isLoading, currentUser, onShare }) => {
  const isOwner = event.userId === currentUser.id;
  const isSharedWithCurrentUser = event.sharedWith && event.sharedWith.some(s => s.userId === currentUser.id);
  const canEdit = isOwner || isSharedWithCurrentUser;

  const handleDelete = () => {
    if (!isOwner) {
      alert("شما صاحب این رویداد نیستید و نمی‌توانید آن را حذف کنید.");
      return;
    }
    const isActuallyShared = event.sharedWith && event.sharedWith.length > 0;
    const confirmMessage = isActuallyShared
      ? `این رویداد با دیگران به اشتراک گذاشته شده است. حذف آن، دسترسی همه کاربران را قطع خواهد کرد. آیا از حذف "${event.title}" مطمئن هستید؟`
      : `آیا از حذف رویداد "${event.title}" مطمئن هستید؟ این عمل قابل بازگشت نیست.`;
    
    if (window.confirm(confirmMessage)) {
      onDelete(event.id);
    }
  };

  const handleEdit = () => {
    if (canEdit) {
        onEdit(event);
    } else {
        alert("شما اجازه ویرایش این رویداد را ندارید.");
    }
  };

  const handleShare = () => {
    if(!isOwner){
        alert("فقط صاحب رویداد می‌تواند آن را به اشتراک بگذارد.");
        return;
    }
    onShare(event.id, event.title, 'chronicle', event.userId);
  };
  
  return (
    <article className="bg-white bg-opacity-90 p-5 rounded-lg shadow-lg text-right flex flex-col sm:flex-row gap-4 items-start transition-shadow hover:shadow-xl relative">
       {/* Shared Icon Overlay */}
      {(event.sharedWith && event.sharedWith.length > 0) && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10" title={`به اشتراک گذاشته شده با ${event.sharedWith.length} نفر`}>
          <i className="fas fa-users ml-1"></i> اشتراکی
        </div>
      )}
       {!isOwner && isSharedWithCurrentUser && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10" title="به اشتراک گذاشته شده با شما">
            <i className="fas fa-user-friends ml-1"></i> اشتراک با شما
            </div>
        )}

      {event.image && (
        <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 mb-3 sm:mb-0">
          <img 
            src={event.image.dataUrl} 
            alt={event.title} 
            className="w-full h-full object-cover rounded-md shadow"
          />
        </div>
      )}
      {!event.image && (
         <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 mb-3 sm:mb-0 bg-slate-200 rounded-md flex items-center justify-center" aria-label="بدون تصویر">
            <i className="fas fa-calendar-day text-5xl text-slate-400"></i>
         </div>
      )}

      <div className="flex-grow">
        <h4 className="text-xl font-semibold text-emerald-700 mb-1">{event.title}</h4>
        {!isOwner && <p className="text-xs text-slate-500 mb-1">صاحب: {event.userId}</p>}
        <p className="text-xs text-slate-500 mb-2">
          ثبت شده در: {formatDateTimeForDisplay(event.createdAt, {dateStyle: 'short', timeStyle: 'short'})}
          {event.updatedAt && event.updatedAt !== event.createdAt && (
            <span className="italic"> (ویرایش شده: {formatDateTimeForDisplay(event.updatedAt, {dateStyle: 'short', timeStyle: 'short'})})</span>
          )}
        </p>
        {event.description && (
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words leading-relaxed mb-3">
            {event.description}
          </p>
        )}
        {!event.description && (
            <p className="text-sm text-slate-500 italic mb-3">توضیحی برای این رویداد ثبت نشده است.</p>
        )}
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse mt-auto pt-2 border-t border-slate-200 sm:border-none">
          <button
            onClick={handleEdit}
            disabled={isLoading || !canEdit}
            className="w-full sm:w-auto px-4 py-1.5 text-xs font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-400 transition-colors disabled:opacity-60 flex items-center justify-center"
          >
            <i className="fas fa-pencil-alt ml-1.5"></i>ویرایش
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || !isOwner}
            className="w-full sm:w-auto px-4 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition-colors disabled:opacity-60 flex items-center justify-center"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin ml-1.5"></i> : <i className="fas fa-trash-alt ml-1.5"></i>}
            حذف
          </button>
           {isOwner && (
            <button
                onClick={handleShare}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400 transition-colors disabled:opacity-60 flex items-center justify-center"
            >
                <i className="fas fa-share-alt ml-1.5"></i>اشتراک‌گذاری
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ChronicleEventCard;