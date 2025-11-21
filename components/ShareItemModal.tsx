

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../types';

interface ShareItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  itemId: string; 
  itemType: 'memory' | 'chronicle'; 
  ownerUserId: string;
  currentUser: User;
  allUsers: User[]; 
  onConfirmShare: (targetUsers: User[]) => Promise<void>;
  onViewUserProfile: (user: User) => void; // Added prop
}

const ShareItemModal: React.FC<ShareItemModalProps> = ({
  isOpen,
  onClose,
  itemTitle,
  ownerUserId, 
  currentUser,
  allUsers, 
  onConfirmShare,
  onViewUserProfile, // Added
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]); 
      setSearchTerm('');
      setError(null);
      setTimeout(() => searchInputRef.current?.focus(), 100); 
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
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

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allUsers;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allUsers.filter(user => {
      const nameMatch = user.searchableByName && 
                        ((user.firstName && user.firstName.toLowerCase().includes(lowerSearchTerm)) ||
                         (user.lastName && user.lastName.toLowerCase().includes(lowerSearchTerm)));
      const usernameMatch = user.username.toLowerCase().includes(lowerSearchTerm);
      const handleMatch = user.handle && user.handle.toLowerCase().includes(lowerSearchTerm);
      return nameMatch || usernameMatch || handleMatch;
    });
  }, [allUsers, searchTerm]);

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map(u => u.id);
    setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...allFilteredIds])));
  };
  
  const handleDeselectAllFiltered = () => {
     const allFilteredIdsSet = new Set(filteredUsers.map(u => u.id));
     setSelectedUserIds(prev => prev.filter(id => !allFilteredIdsSet.has(id)));
  };


  const handleShare = async () => {
    if (selectedUserIds.length === 0) {
      setError("لطفاً حداقل یک کاربر را برای اشتراک‌گذاری انتخاب کنید.");
      return;
    }
    if (ownerUserId !== currentUser.id) {
        setError("فقط صاحب آیتم می‌تواند آن را اشتراک بگذارد.");
        return;
    }

    const targetUsersToShareWith = allUsers.filter(u => selectedUserIds.includes(u.id));
    
    if (targetUsersToShareWith.length === 0) {
        setError("کاربران انتخاب شده معتبر نیستند یا یافت نشدند."); 
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirmShare(targetUsersToShareWith);
    } catch (e: any) {
      setError(e.message || "خطا در فرآیند اشتراک‌گذاری.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4"  
        onClick={handleBackdropClick}
        role="dialog" aria-modal="true" aria-labelledby="share-item-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all text-right flex flex-col max-h-[80vh]"
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 id="share-item-title" className="text-xl font-semibold text-slate-800">
            <i className="fas fa-share-alt ml-2 text-green-500"></i>اشتراک‌گذاری "{itemTitle}"
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن مودال اشتراک‌گذاری"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-5 space-y-4 flex-grow overflow-y-auto">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm" role="alert">{error}</div>}
          
          {allUsers.length === 0 ? (
            <p className="text-slate-600">کاربر دیگری برای اشتراک‌گذاری یافت نشد.</p>
          ) : (
            <>
              <div>
                <label htmlFor="userSearch" className="block text-sm font-medium text-slate-700 mb-1">
                  جستجوی کاربر:
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  id="userSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام، نام خانوادگی، نام کاربری..."
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900"
                />
              </div>

              {filteredUsers.length > 0 && (
                <div className="flex justify-between items-center my-2">
                    <button onClick={handleSelectAllFiltered} className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded hover:bg-sky-200">انتخاب همه نمایش داده شده ها</button>
                    <button onClick={handleDeselectAllFiltered} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">لغو انتخاب همه نمایش داده شده ها</button>
                </div>
              )}

              {filteredUsers.length > 0 ? (
                <ul className="mt-2 border border-slate-200 rounded-md max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <li key={user.id}>
                      <div className={`w-full flex items-center p-3 text-right hover:bg-sky-50 focus-within:bg-sky-100 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-sky-100 ring-1 ring-sky-400' : ''}`}>
                        <input
                            type="checkbox"
                            id={`user-share-${user.id}`}
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleToggleUserSelection(user.id)}
                            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 ml-3 flex-shrink-0"
                        />
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); onViewUserProfile(user); }} 
                            className="flex items-center min-w-0 flex-grow text-right group"
                            aria-label={`مشاهده پروفایل ${user.username}`}
                        >
                            {user.avatarUrl ? 
                            <img src={user.avatarUrl} alt={`${user.username} avatar`} className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"/>
                            : <span className="w-10 h-10 rounded-full mr-3 bg-slate-300 flex items-center justify-center text-slate-500 text-lg flex-shrink-0"><i className="fas fa-user"></i></span>
                            }
                            <div className="flex-grow min-w-0">
                            <span className="block font-medium text-slate-800 truncate group-hover:text-sky-600 group-hover:underline">
                                {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username)}
                            </span>
                            <span className="block text-xs text-slate-500 truncate group-hover:text-sky-500">
                                {user.handle ? user.handle : `@${user.username}`}
                                {(user.firstName || user.lastName) && user.handle && user.handle !== `@${user.username}` && <span className="ml-2">({`@${user.username}`})</span>}
                            </span>
                            </div>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm mt-3 text-center">
                  کاربری با این مشخصات یافت نشد.
                </p>
              )}
            </>
          )}
        </div>

        <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 space-x-reverse flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleShare}
            disabled={isLoading || selectedUserIds.length === 0 || allUsers.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? <><i className="fas fa-spinner fa-spin ml-2"></i>در حال اشتراک‌گذاری...</> : <><i className="fas fa-check ml-2"></i>اشتراک‌گذاری</>}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ShareItemModal;