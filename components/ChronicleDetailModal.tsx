import React, { useEffect, useRef } from 'react';
import { ChronicleDetailModalProps } from '../types';
import { formatDateTimeForDisplay } from '../utils/dateUtils';

const ChronicleDetailModal: React.FC<ChronicleDetailModalProps> = ({ event, onClose, currentUser, allUsers, onViewUserProfile }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (event) {
        window.addEventListener('keydown', handleEsc);
        modalRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [event, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) onClose();
  };

  if (!event) return null;

  const isOwner = event.userId === currentUser.id;
  const owner = allUsers.find(u => u.id === event.userId) ?? (isOwner ? currentUser : null);
  const ownerDisplayName = owner ? (owner.handle || owner.username) : 'کاربر ناشناس';


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[85] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chronicle-detail-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col transform transition-all text-right"
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 id="chronicle-detail-title" className="text-xl font-semibold text-slate-800 break-words">
            <i className="fas fa-calendar-day mr-2 text-emerald-500"></i>جزئیات رویداد روزنگار
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-4">
          {event.image && (
            <div className="w-full h-64 bg-slate-100 rounded-lg shadow-inner mb-4">
              <img src={event.image.dataUrl} alt={event.title} className="w-full h-full object-contain" />
            </div>
          )}

          <h3 className="text-2xl font-bold text-emerald-700">{event.title}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-md">
                <p className="text-xs text-slate-500">تاریخ رویداد</p>
                <p className="font-semibold text-slate-700">{formatDateTimeForDisplay(event.eventDate, { showTime: false, dateStyle: "long" })}</p>
            </div>
             <div className="bg-slate-50 p-3 rounded-md">
                <p className="text-xs text-slate-500">ثبت شده توسط</p>
                <button
                    onClick={() => owner && onViewUserProfile(owner)}
                    className="font-semibold text-sky-600 hover:underline disabled:no-underline disabled:text-slate-700"
                    disabled={!owner}
                >
                    {ownerDisplayName}
                </button>
            </div>
          </div>
          
          {event.description && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">شرح رویداد:</h4>
              <p className="text-slate-800 whitespace-pre-wrap break-words leading-relaxed bg-slate-50 p-4 rounded-md">
                {event.description}
              </p>
            </div>
          )}

           <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-200">
                <p>ثبت شده در: {formatDateTimeForDisplay(event.createdAt)}</p>
                {event.updatedAt && event.updatedAt !== event.createdAt && <p>(ویرایش شده در: {formatDateTimeForDisplay(event.updatedAt)})</p>}
           </div>

        </div>

        <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            بستن
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChronicleDetailModal;
