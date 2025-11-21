


import React, { useState } from 'react';
import { MemoryEntry, Companion, User } from '../types';
import { formatDateTimeForDisplay } from '../utils/dateUtils';

interface MemoryCardProps {
  memory: MemoryEntry;
  companionsList: Companion[];
  onDelete: (id: string) => void;
  onEdit: (memory: MemoryEntry) => void;
  onViewDetails: (memory: MemoryEntry) => void;
  currentUser: User;
  onShare: (id: string, title: string, type: 'memory' | 'chronicle', ownerUserId: string) => void;
  ownerInfo?: User; // Optional: For displaying owner info on public pages
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + "...";
};

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, companionsList, onDelete, onEdit, onViewDetails, currentUser, onShare, ownerInfo }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwner = memory.userId === currentUser.id;
  const isSharedWithCurrentUser = memory.sharedWith && memory.sharedWith.some(s => s.userId === currentUser.id);
  const canEdit = isOwner; // Only owner can edit from card view

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % memory.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + memory.images.length) % memory.images.length);
  };

  const handleCardClick = () => {
    onViewDetails(memory);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onViewDetails(memory);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
      onEdit(memory);
    } else {
      alert("شما اجازه ویرایش این خاطره را ندارید.");
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
        alert("شما صاحب این خاطره نیستید و نمی‌توانید آن را حذف کنید.");
        return;
    }
    const isActuallyShared = memory.sharedWith && memory.sharedWith.length > 0;
    const confirmMessage = isActuallyShared 
        ? `این خاطره با دیگران به اشتراک گذاشته شده است. حذف آن، دسترسی همه کاربران را قطع خواهد کرد. آیا از حذف "${memory.title}" مطمئن هستید؟`
        : `آیا از حذف "${memory.title}" مطمئن هستید؟ این عمل قابل بازگشت نیست.`;

    if (window.confirm(confirmMessage)) {
      onDelete(memory.id);
    }
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
        alert("فقط صاحب خاطره می‌تواند آن را به اشتراک بگذارد.");
        return;
    }
    onShare(memory.id, memory.title, 'memory', memory.userId);
  };

  const getCompanionNames = () => {
    if (!memory.companions || memory.companions.length === 0) return null;
    
    const names = memory.companions.map(link => {
      const comp = companionsList.find(c => c.id === link.companionId);
      return comp ? comp.name : 'ناشناس';
    }).slice(0, 2); 
    
    let text = names.join('، ');
    if (memory.companions.length > 2) {
      text += ` و ${memory.companions.length - 2} نفر دیگر`;
    }
    return text;
  };

  const companionText = getCompanionNames();


  return (
    <article 
      className="bg-white bg-opacity-95 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-sky-400/60 hover:scale-[1.025] focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 cursor-pointer group/card text-right"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`مشاهده جزئیات برای ${memory.title}`}
    >
      {memory.images.length > 0 && (
        <div className="relative w-full h-56 group/image_carousel">
          <img 
            src={memory.images[currentImageIndex].dataUrl} 
            alt={memory.images[currentImageIndex].name || memory.title} 
            className="w-full h-full object-cover"
          />
           {/* Shared Icon Overlay */}
            {(memory.sharedWith && memory.sharedWith.length > 0) && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg" title={`به اشتراک گذاشته شده با ${memory.sharedWith.length} نفر`}>
                <i className="fas fa-users ml-1"></i> اشتراکی
              </div>
            )}
            {!isOwner && isSharedWithCurrentUser && (
                 <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-lg" title={`به اشتراک گذاشته شده با شما توسط ${memory.userId === currentUser.id ? 'خودتان' : (memory.sharedWith?.find(s=>s.userId === memory.userId)?.username || 'صاحب اصلی')}`}>
                    <i className="fas fa-user-friends ml-1"></i> اشتراک با شما
                </div>
            )}
          {memory.images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage} 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity opacity-0 group-hover/image_carousel:opacity-100 focus:opacity-100 focus:outline-none"
                aria-label="تصویر قبلی"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={handleNextImage} 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity opacity-0 group-hover/image_carousel:opacity-100 focus:opacity-100 focus:outline-none"
                aria-label="تصویر بعدی"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                {currentImageIndex + 1} / {memory.images.length}
              </div>
            </>
          )}
        </div>
      )}
       {memory.images.length === 0 && (
         <div className="w-full h-56 bg-slate-200 flex items-center justify-center relative" aria-label="تصویری موجود نیست">
            <i className="fas fa-image text-6xl text-slate-400"></i>
            {(memory.sharedWith && memory.sharedWith.length > 0) && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg" title={`به اشتراک گذاشته شده با ${memory.sharedWith.length} نفر`}>
                <i className="fas fa-users ml-1"></i> اشتراکی
              </div>
            )}
             {!isOwner && isSharedWithCurrentUser && (
                 <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-lg" title="به اشتراک گذاشته شده با شما">
                    <i className="fas fa-user-friends ml-1"></i> اشتراک با شما
                </div>
            )}
         </div>
       )}

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-2xl font-semibold text-slate-800 mb-1 group-hover/card:text-sky-600 transition-colors">{memory.title}</h3>
        <div className="text-sm text-sky-600 font-medium mb-1">
          <i className="fas fa-map-marker-alt ml-1"></i> {memory.locationName}
        </div>
        {!isOwner && ownerInfo && <p className="text-xs text-slate-500 mb-1">صاحب: {ownerInfo.handle || ownerInfo.username}</p>}
        {!isOwner && !ownerInfo && <p className="text-xs text-slate-500 mb-1">صاحب: {memory.userId}</p>}
        
        {memory.latitude && memory.longitude && (
          <div className="text-xs text-slate-500 mb-2">
            عرض جغرافیایی: {memory.latitude.toFixed(4)}، طول جغرافیایی: {memory.longitude.toFixed(4)}
            <a 
              href={`https://www.google.com/maps?q=${memory.latitude},${memory.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} 
              className="mr-2 text-sky-500 hover:text-sky-700 hover:underline focus:outline-none focus:ring-1 focus:ring-sky-500 rounded"
              aria-label={`مشاهده ${memory.locationName} در نقشه گوگل`}
            >
              مشاهده در نقشه <i className="fas fa-external-link-alt text-xs"></i>
            </a>
          </div>
        )}
        <p className="text-xs text-slate-500 mb-1">
          <i className="fas fa-calendar-check ml-1"></i> رویداد: {formatDateTimeForDisplay(memory.eventDate)}
        </p>
        {companionText && (
          <p className="text-xs text-teal-600 mb-3">
            <i className="fas fa-users ml-1"></i> با: {companionText}
          </p>
        )}
        <p className="text-slate-700 text-sm mb-4 flex-grow leading-relaxed whitespace-pre-wrap break-words">
          {truncateText(memory.description, 100)}
        </p>
        
        {memory.geminiPondering && (
          <div className="mt-auto pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 italic mb-1">
                <i className="fas fa-robot ml-1 text-sky-500"></i> تامل هوش مصنوعی:
            </p>
            <p className="text-sm text-slate-600 italic leading-snug  whitespace-pre-wrap break-words">
              {truncateText(memory.geminiPondering, 80)}
            </p>
          </div>
        )}
        
        {isOwner && <div className="mt-4 flex space-x-2 space-x-reverse">
            <button
              onClick={handleEditClick}
              disabled={!canEdit}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`ویرایش خاطره با عنوان: ${memory.title}`}
            >
              <i className="fas fa-pencil-alt ml-2"></i>ویرایش
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={!isOwner}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`حذف خاطره با عنوان: ${memory.title}`}
            >
              <i className="fas fa-trash-alt ml-2"></i>حذف
            </button>
        </div>}
         {isOwner && (
            <button
                onClick={handleShareClick}
                className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label={`اشتراک‌گذاری خاطره با عنوان: ${memory.title}`}
            >
                <i className="fas fa-share-alt ml-2"></i>اشتراک‌گذاری
            </button>
        )}
      </div>
    </article>
  );
};

export default MemoryCard;