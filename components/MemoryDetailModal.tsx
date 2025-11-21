
import React, { useState, useEffect, useRef } from 'react';
import { MemoryEntry, Companion, User } from '../types'; // Added User
import { formatDateTimeForDisplay } from '../utils/dateUtils';

interface MemoryDetailModalProps {
  memory: MemoryEntry;
  companionsList: Companion[];
  onClose: () => void;
  onEdit: (memory: MemoryEntry) => void;
  onDelete: (id: string) => void;
  currentUser: User; // Added
  onShare: (id: string, title: string, type: 'memory' | 'chronicle', ownerUserId: string) => void; // Added
}

const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({ memory, companionsList, onClose, onEdit, onDelete, currentUser, onShare }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const isOwner = memory.userId === currentUser.id;
  const isSharedWithCurrentUser = memory.sharedWith && memory.sharedWith.some(s => s.userId === currentUser.id);
  const canEdit = isOwner || isSharedWithCurrentUser;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % memory.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + memory.images.length) % memory.images.length);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    modalRef.current?.focus(); 
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) {
        onClose();
    }
  };

  const handleDeleteClick = () => {
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
  };
  
  const handleEditClick = () => {
    if (canEdit) {
        onEdit(memory);
    } else {
        alert("شما اجازه ویرایش این خاطره را ندارید.");
    }
  };

  const handleShareClick = () => {
    if (!isOwner) {
        alert("فقط صاحب خاطره می‌تواند آن را به اشتراک بگذارد.");
        return;
    }
    onShare(memory.id, memory.title, 'memory', memory.userId);
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4"
      onClick={handleBackdropClick} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-detail-title"
      aria-describedby="memory-detail-description"
    >
      <div 
        ref={modalRef}
        tabIndex={-1} 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all text-right"
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 id="memory-detail-title" className="text-2xl font-semibold text-slate-800 break-words">
              {memory.title}
            </h2>
            {(memory.sharedWith && memory.sharedWith.length > 0) && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 inline-block" title={`به اشتراک گذاشته شده با ${memory.sharedWith.length} نفر`}>
                <i className="fas fa-users mr-1"></i>اشتراکی
              </span>
            )}
            {!isOwner && isSharedWithCurrentUser && (
                 <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-block" title="به اشتراک گذاشته شده با شما">
                    <i className="fas fa-user-friends mr-1"></i>اشتراک با شما
                </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن جزئیات"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-5 overflow-y-auto flex-grow">
          {memory.images.length > 0 && (
            <div className="relative w-full h-72 sm:h-96 group/image_carousel mb-5 rounded-lg overflow-hidden shadow">
              <img
                src={memory.images[currentImageIndex].dataUrl}
                alt={memory.images[currentImageIndex].name || memory.title}
                className="w-full h-full object-contain bg-slate-100"
              />
              {memory.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover/image_carousel:opacity-100 focus:opacity-100 focus:outline-none"
                    aria-label="تصویر قبلی"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover/image_carousel:opacity-100 focus:opacity-100 focus:outline-none"
                    aria-label="تصویر بعدی"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2.5 py-1.5 rounded-full pointer-events-none">
                    {currentImageIndex + 1} / {memory.images.length}
                  </div>
                </>
              )}
            </div>
          )}
          {memory.images.length === 0 && (
             <div className="w-full h-72 sm:h-96 bg-slate-100 flex items-center justify-center mb-5 rounded-lg shadow" aria-label="تصویری موجود نیست">
                <i className="fas fa-image text-8xl text-slate-400"></i>
             </div>
           )}

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-sky-600 mb-1">
                <i className="fas fa-map-marker-alt ml-2"></i>مکان
              </h4>
              <p className="text-slate-700 text-lg">{memory.locationName}</p>
              {!isOwner && <p className="text-xs text-slate-500 mt-0.5">صاحب: {memory.userId}</p>}
            </div>

            {memory.latitude && memory.longitude && (
              <div className="text-sm text-slate-600">
                عرض جغرافیایی: {memory.latitude.toFixed(5)}، طول جغرافیایی: {memory.longitude.toFixed(5)}
                <a
                  href={`https://www.google.com/maps?q=${memory.latitude},${memory.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 text-sky-500 hover:text-sky-700 hover:underline focus:outline-none focus:ring-1 focus:ring-sky-500 rounded"
                  aria-label={`مشاهده ${memory.locationName} در نقشه گوگل`}
                >
                  مشاهده در نقشه <i className="fas fa-external-link-alt text-xs"></i>
                </a>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-sky-600 mb-1">
                    <i className="fas fa-calendar-check ml-2"></i>تاریخ و ساعت رویداد
                  </h4>
                  <p className="text-slate-700">{formatDateTimeForDisplay(memory.eventDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">
                    <i className="fas fa-save ml-2"></i>تاریخ ثبت در سیستم
                  </h4>
                  <p className="text-slate-600">{formatDateTimeForDisplay(memory.createdAt)}</p>
                </div>
            </div>


            <div>
              <h4 className="text-sm font-semibold text-sky-600 mb-1 mt-2">
                <i className="fas fa-pen-alt ml-2"></i>توضیحات / یادداشت‌ها
              </h4>
              <p id="memory-detail-description" className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                {memory.description}
              </p>
            </div>

            {memory.companions && memory.companions.length > 0 && (
              <div className="pt-3 border-t border-slate-200 mt-4">
                <h4 className="text-sm font-semibold text-teal-600 mb-2">
                  <i className="fas fa-users ml-2"></i>همسفران در این سفر
                </h4>
                <ul className="space-y-1.5 list-disc list-inside pr-1">
                  {memory.companions.map(link => {
                    const companion = companionsList.find(c => c.id === link.companionId);
                    return (
                      <li key={link.companionId} className="text-sm text-slate-700">
                        <span className="font-medium">{companion ? companion.name : 'همسفر ناشناس'}</span>
                        {link.roleInTrip && <span className="text-slate-500 italic"> ({link.roleInTrip})</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {memory.geminiPondering && (
              <div className="pt-3 border-t border-slate-200 mt-4">
                <h4 className="text-sm font-semibold text-sky-600 mb-1">
                  <i className="fas fa-robot ml-2"></i>تامل هوش مصنوعی
                </h4>
                <p className="text-slate-600 italic whitespace-pre-wrap break-words leading-relaxed">
                  "{memory.geminiPondering}"
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
          <button
            onClick={handleEditClick}
            disabled={!canEdit}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors flex items-center justify-center disabled:opacity-50"
            aria-label={`ویرایش خاطره با عنوان: ${memory.title}`}
          >
            <i className="fas fa-pencil-alt ml-2"></i>ویرایش
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={!isOwner}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center disabled:opacity-50"
            aria-label={`حذف خاطره با عنوان: ${memory.title}`}
          >
            <i className="fas fa-trash-alt ml-2"></i>حذف
          </button>
          {isOwner && (
            <button
                onClick={handleShareClick}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center justify-center"
                aria-label={`اشتراک‌گذاری خاطره با عنوان: ${memory.title}`}
            >
                <i className="fas fa-share-alt ml-2"></i>اشتراک‌گذاری
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            بستن
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MemoryDetailModal;