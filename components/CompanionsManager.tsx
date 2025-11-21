

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../types'; // Companion type is implicitly used via onAddCompanion

const inputFieldClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-slate-900";

interface CompanionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  companions: { id: string; name: string; contact?: string; generalRelationship?: string; notes?: string; userId: string; }[]; 
  onAddCompanion: (companionData: Omit<{ id: string; name: string; contact?: string; generalRelationship?: string; notes?: string; userId: string; }, 'id' | 'userId'>) => void; 
  allUsers: User[]; 
  currentUser: User; 
  onViewUserProfile: (user: User) => void; // Added prop
}

const CompanionsManager: React.FC<CompanionsManagerProps> = ({
  isOpen,
  onClose,
  companions,
  onAddCompanion,
  allUsers,
  currentUser,
  onViewUserProfile, // Added
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [generalRelationship, setGeneralRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
      setShowUserSelection(false); 
      setUserSearchTerm(''); 
    } else {
      setName('');
      setContact('');
      setGeneralRelationship('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('نام همسفر الزامی است.');
      return;
    }
    setError(null);
    onAddCompanion({ name, contact, generalRelationship, notes });
    setName('');
    setContact('');
    setGeneralRelationship('');
    setNotes('');
    setShowUserSelection(false); 
    nameInputRef.current?.focus();
  };
  
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

  const availableUsersForSelection = useMemo(() => {
    const existingCompanionNames = new Set(companions.map(c => c.name.toLowerCase()));
    return allUsers.filter(user => 
        user.id !== currentUser.id && 
        !existingCompanionNames.has((`${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase() || (user.handle || user.username).toLowerCase()))
    );
  }, [allUsers, currentUser, companions]);
  
  const filteredUsersForSelection = useMemo(() => {
    if (!userSearchTerm.trim()) {
      return availableUsersForSelection;
    }
    const lowerSearchTerm = userSearchTerm.toLowerCase();
    return availableUsersForSelection.filter(user => {
      const nameMatch = (user.firstName && user.firstName.toLowerCase().includes(lowerSearchTerm)) ||
                        (user.lastName && user.lastName.toLowerCase().includes(lowerSearchTerm));
      const usernameMatch = user.username.toLowerCase().includes(lowerSearchTerm);
      const handleMatch = user.handle && user.handle.toLowerCase().includes(lowerSearchTerm);
      return nameMatch || usernameMatch || handleMatch;
    });
  }, [availableUsersForSelection, userSearchTerm]);

  const handleSelectUserAsCompanion = (selectedUser: User) => {
    setName(`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || (selectedUser.handle || selectedUser.username));
    setContact(selectedUser.handle || selectedUser.username); 
    setGeneralRelationship(''); 
    setNotes(''); 
    setShowUserSelection(false); 
    nameInputRef.current?.focus(); 
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="companions-manager-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all text-right"
        tabIndex={-1}
      >
        <header className="p-5 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center sticky top-0 z-10">
          <h2 id="companions-manager-title" className="text-2xl font-semibold text-slate-800">
            <i className="fas fa-users-cog ml-2 text-teal-500"></i>مدیریت همسفران
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن مدیریت همسفران"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        {/* Add New Companion Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-700">افزودن همسفر جدید</h3>
            <button 
              type="button" 
              onClick={() => setShowUserSelection(prev => !prev)}
              className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-md hover:bg-teal-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {showUserSelection ? <><i className="fas fa-times mr-1"></i> بستن لیست کاربران</> : <><i className="fas fa-user-plus mr-1"></i> افزودن از کاربران موجود</>}
            </button>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm" role="alert">{error}</div>}
          
          <div>
            <label htmlFor="comp-name" className="block text-sm font-medium text-slate-700 mb-1">نام <span className="text-red-500">*</span></label>
            <input ref={nameInputRef} type="text" id="comp-name" value={name} onChange={(e) => setName(e.target.value)} className={inputFieldClass} placeholder="مثال: علی رضایی" required />
          </div>
          <div>
            <label htmlFor="comp-contact" className="block text-sm font-medium text-slate-700 mb-1">اطلاعات تماس (اختیاری)</label>
            <input type="text" id="comp-contact" value={contact} onChange={(e) => setContact(e.target.value)} className={inputFieldClass} placeholder="مثال: @alireza یا ایمیل" />
          </div>
          <div>
            <label htmlFor="comp-relationship" className="block text-sm font-medium text-slate-700 mb-1">نسبت کلی (اختیاری)</label>
            <input type="text" id="comp-relationship" value={generalRelationship} onChange={(e) => setGeneralRelationship(e.target.value)} className={inputFieldClass} placeholder="مثال: دوست، خانواده، همکار" />
          </div>
          <div>
            <label htmlFor="comp-notes" className="block text-sm font-medium text-slate-700 mb-1">یادداشت (اختیاری)</label>
            <textarea id="comp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputFieldClass} placeholder="یادداشت‌های اضافی درباره این همسفر..." />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors flex items-center">
              <i className="fas fa-user-check mr-2"></i>ثبت این همسفر
            </button>
          </div>
        </form>

        {/* User Selection Section */}
        {showUserSelection && (
          <div className="p-5 space-y-3 bg-white border-b border-slate-200">
            <h4 className="text-md font-semibold text-slate-600">انتخاب از کاربران سیستم:</h4>
            <input 
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="جستجو نام، نام خانوادگی، نام کاربری..."
              className={`${inputFieldClass} mb-2`}
            />
            {filteredUsersForSelection.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
                {filteredUsersForSelection.map(user => (
                  <li key={user.id} className="p-2 hover:bg-teal-50 flex justify-between items-center">
                    <button 
                        type="button" 
                        onClick={() => onViewUserProfile(user)} 
                        className="flex items-center min-w-0 flex-grow text-right group"
                        aria-label={`مشاهده پروفایل ${user.username}`}
                    >
                      {user.avatarUrl ? 
                        <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full mr-2 object-cover"/>
                        : <span className="w-8 h-8 rounded-full mr-2 bg-slate-300 flex items-center justify-center text-slate-500"><i className="fas fa-user text-sm"></i></span>
                      }
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-800 group-hover:text-teal-600 group-hover:underline truncate">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}</span>
                        <span className="block text-xs text-slate-500 group-hover:text-teal-500 truncate">{user.handle || `@${user.username}`}</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleSelectUserAsCompanion(user)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 flex-shrink-0"
                      aria-label={`انتخاب ${user.username} به عنوان همسفر`}
                    >
                      انتخاب
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                {availableUsersForSelection.length === 0 ? "کاربر دیگری (که قبلاً اضافه نشده) برای انتخاب موجود نیست." : "نتیجه‌ای برای جستجو یافت نشد."}
              </p>
            )}
          </div>
        )}


        {/* Existing Companions List */}
        <div className="p-5 flex-grow overflow-y-auto">
          <h3 className="text-lg font-medium text-slate-700 mb-3">همسفران ثبت شده ({companions.length})</h3>
          {companions.length === 0 ? (
            <p className="text-sm text-slate-500">هنوز همسفری اضافه نکرده‌اید.</p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {companions.slice().reverse().map(comp => ( 
                <li key={comp.id} className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <p className="font-semibold text-slate-800 text-md">{comp.name}</p>
                  {comp.contact && <p className="text-xs text-slate-600 mt-0.5"><i className="fas fa-address-card mr-1.5 text-slate-400"></i> {comp.contact}</p>}
                  {comp.generalRelationship && <p className="text-xs text-slate-600 mt-0.5"><i className="fas fa-users mr-1.5 text-slate-400"></i> {comp.generalRelationship}</p>}
                  {comp.notes && <p className="text-xs text-slate-500 mt-1.5 italic whitespace-pre-wrap break-words border-t border-slate-100 pt-1.5">یادداشت: {comp.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <footer className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end sticky bottom-0 z-10">
             <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
              >
                انجام شد و بستن
            </button>
        </footer>
      </div>
    </div>
  );
};


export default CompanionsManager;