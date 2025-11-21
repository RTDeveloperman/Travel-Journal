


import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { getCountryNameByCode } from '../utils/countryUtils';

interface UserProfileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  currentUser: User; 
  onStartChat?: (targetUser: User) => void; 
  // Follow actions
  onSendFollowRequest: (targetId: string) => Promise<void>;
  onAcceptFollowRequest: (requesterId: string) => Promise<void>;
  onDeclineFollowRequest: (requesterId: string) => Promise<void>;
  onUnfollow: (targetId: string) => Promise<void>;
}

const UserProfileViewerModal: React.FC<UserProfileViewerModalProps> = ({ 
    isOpen, 
    onClose, 
    targetUser,
    currentUser,
    onStartChat,
    onSendFollowRequest,
    onAcceptFollowRequest,
    onDeclineFollowRequest,
    onUnfollow
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      modalRef.current?.focus();
      setIsProcessing(false);
      setError(null);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) {
      onClose();
    }
  };
  
  const handleAction = async (action: () => Promise<void>) => {
      setIsProcessing(true);
      setError(null);
      try {
          await action();
          // The parent component (App.tsx) is responsible for refreshing user data.
      } catch (e: any) {
          setError(e.message || "An unknown error occurred.");
      } finally {
          setIsProcessing(false);
      }
  };

  if (!isOpen || !targetUser) return null;

  const displayName = targetUser.firstName || targetUser.lastName 
    ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()
    : (targetUser.handle || targetUser.username);
  
  const displayHandle = targetUser.handle || `@${targetUser.username}`;
  const isViewingSelf = currentUser && currentUser.id === targetUser.id;
  
  const isFollowing = currentUser.following?.includes(targetUser.id);
  const hasSentRequest = currentUser.sentFollowRequests?.includes(targetUser.id);
  const hasPendingRequestFromTarget = currentUser.pendingFollowRequests?.includes(targetUser.id);

  const renderFollowButton = () => {
      if (isViewingSelf) return null;

      if (hasPendingRequestFromTarget) {
          return (
              <>
                <button onClick={() => handleAction(() => onDeclineFollowRequest(targetUser.id))} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50">رد درخواست</button>
                <button onClick={() => handleAction(() => onAcceptFollowRequest(targetUser.id))} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50">پذیرش درخواست</button>
              </>
          );
      }
      if (isFollowing) {
           return <button onClick={() => handleAction(() => onUnfollow(targetUser.id))} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-slate-500 rounded-md hover:bg-slate-600 disabled:opacity-50">آنفالو</button>;
      }
      if (hasSentRequest) {
          return <button disabled className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-200 rounded-md cursor-not-allowed">درخواست ارسال شد</button>;
      }
      return <button onClick={() => handleAction(() => onSendFollowRequest(targetUser.id))} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 disabled:opacity-50">دنبال کردن</button>;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[90] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-viewer-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all text-right"
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
          <h2 id="user-profile-viewer-title" className="text-xl font-semibold text-slate-800 truncate">
            <i className="fas fa-user-circle ml-2 text-sky-500"></i>پروفایل {displayName}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن پروفایل کاربر"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-col items-center text-center">
            {targetUser.avatarUrl ? (
              <img 
                src={targetUser.avatarUrl} 
                alt={`آواتار ${displayName}`} 
                className="w-28 h-28 rounded-full border-4 border-sky-300 shadow-lg object-cover mb-3"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-sky-300 shadow-lg bg-slate-200 flex items-center justify-center mb-3">
                <i className="fas fa-user text-5xl text-slate-400"></i>
              </div>
            )}
            <h3 className="text-2xl font-bold text-slate-800">{displayName}</h3>
            <p className="text-md text-sky-600">{displayHandle}</p>
            <div className="flex space-x-4 space-x-reverse mt-2 text-sm text-slate-600">
                <span><span className="font-bold">{targetUser.followers?.length || 0}</span> دنبال‌کننده</span>
                <span><span className="font-bold">{targetUser.following?.length || 0}</span> دنبال‌شونده</span>
            </div>
            {targetUser.country && (
              <p className="text-sm text-slate-500 mt-1">
                <i className="fas fa-map-marker-alt ml-1 text-slate-400"></i>
                {getCountryNameByCode(targetUser.country)}
              </p>
            )}
          </div>

          {targetUser.bio && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-600 mb-1">درباره من:</h4>
              <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed bg-slate-50 p-3 rounded-md">
                {targetUser.bio}
              </p>
            </div>
          )}
           {!targetUser.bio && (
            <div className="pt-4 border-t border-slate-200">
               <p className="text-slate-500 text-sm italic text-center py-2">این کاربر هنوز بیوگرافی ننوشته است.</p>
            </div>
           )}

        </div>
        <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center sticky bottom-0 z-10 space-x-2 space-x-reverse">
            <div className="flex-grow flex items-center justify-end space-x-2 space-x-reverse">
                {renderFollowButton()}
                {onStartChat && !isViewingSelf && targetUser.role !== 'admin' && (
                    <button
                        onClick={() => onStartChat(targetUser)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
                    >
                        <i className="fas fa-comments ml-2"></i>چت
                    </button>
                )}
            </div>
            <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            >
                بستن
            </button>
        </footer>
      </div>
    </div>
  );
};

export default UserProfileViewerModal;