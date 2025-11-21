


import React, { useState, useEffect, useRef } from 'react';
import { User, ImageFile, GenderOption } from '../types';
import { countriesList } from '../utils/countryUtils'; // Import countriesList
import { genderOptionsList } from '../utils/genderUtils'; // Import genderOptionsList
import clsx from 'clsx';

// Helper class for consistent input styling
const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500";

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (payload: {
    handle?: string;
    activeAvatarId?: string;
    newProfileImage?: ImageFile;
    deleteProfileImageId?: string;
    firstName?: string;
    lastName?: string;
    searchableByName?: boolean;
    country?: string; 
    dateOfBirth?: string;
    gender?: GenderOption; 
    bio?: string; 
  }) => Promise<User | null>;
  isLoading: boolean;
  allUsers: User[]; // For resolving user details
  onAcceptFollowRequest: (requesterId: string) => Promise<void>;
  onDeclineFollowRequest: (requesterId: string) => Promise<void>;
  onUnfollow: (targetId: string) => Promise<void>;
  onViewUserProfile: (user: User) => void;
}

type ActiveTab = 'details' | 'followers' | 'following' | 'requests';

const ProfileManager: React.FC<ProfileManagerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  isLoading: appIsLoading,
  allUsers,
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onUnfollow,
  onViewUserProfile
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('details');
  const [localHandleInputValue, setLocalHandleInputValue] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [searchableByName, setSearchableByName] = useState<boolean>(false);
  const [country, setCountry] = useState<string>(''); 
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<GenderOption>(''); 
  const [bio, setBio] = useState<string>(''); 
  const [profileImages, setProfileImages] = useState<ImageFile[]>([]);
  const [activeAvatarId, setActiveAvatarId] = useState<string | undefined>(undefined);
  
  const [error, setError] = useState<string | null>(null);
  const [formIsLoading, setFormIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setLocalHandleInputValue(currentUser.handle ? currentUser.handle.substring(1) : (currentUser.username || ''));
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setSearchableByName(currentUser.searchableByName || false);
      setCountry(currentUser.country || ''); 
      setDateOfBirth(currentUser.dateOfBirth || '');
      setGender(currentUser.gender || '');
      setBio(currentUser.bio || ''); 
      setProfileImages(currentUser.profileImages || []);
      const currentActiveImage = (currentUser.profileImages || []).find(img => img.dataUrl === currentUser.avatarUrl);
      setActiveAvatarId(currentActiveImage?.id);
      setError(null);
      setSuccessMessage(null);
      setActiveTab('details');
      handleInputRef.current?.focus();
    }
  }, [isOpen, currentUser]);

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("فایل انتخاب شده یک تصویر معتبر نیست.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) { 
        setError("حجم تصویر پروفایل نباید بیشتر از ۲ مگابایت باشد.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImage: ImageFile = {
          id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type,
          dataUrl: reader.result as string,
        };
        
        setFormIsLoading(true);
        try {
            const updatedUser = await onUpdateProfile({ newProfileImage: newImage });
            if (updatedUser) {
              setProfileImages(updatedUser.profileImages || []);
              if (!updatedUser.avatarUrl && updatedUser.profileImages?.length === 1) {
                const newActiveUser = await onUpdateProfile({ activeAvatarId: newImage.id });
                if (newActiveUser) {
                    setActiveAvatarId(newImage.id);
                }
              }
              setSuccessMessage("تصویر پروفایل با موفقیت افزوده شد.");
            }
        } catch (e: any) {
             setError(e.message || "خطا در افزودن تصویر پروفایل.");
        } finally {
            setFormIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfileImage = async (imageId: string) => {
    if (!window.confirm("آیا از حذف این تصویر پروفایل مطمئن هستید؟")) return;
    setFormIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const updatedUser = await onUpdateProfile({ deleteProfileImageId: imageId });
        if (updatedUser) {
          setProfileImages(updatedUser.profileImages || []);
          if (activeAvatarId === imageId || updatedUser.avatarUrl === undefined) { 
            setActiveAvatarId(undefined);
          }
          setSuccessMessage("تصویر پروفایل حذف شد.");
        }
    } catch (e: any) {
        setError(e.message || "خطا در حذف تصویر پروفایل.");
    } finally {
        setFormIsLoading(false);
    }
  };

  const handleSetAvatar = async (imageId: string) => {
    setFormIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const updatedUser = await onUpdateProfile({ activeAvatarId: imageId });
        if (updatedUser) {
            const newActiveImg = updatedUser.profileImages?.find(img => img.id === imageId);
            if (newActiveImg && updatedUser.avatarUrl === newActiveImg.dataUrl) {
                setActiveAvatarId(imageId);
            }
            setSuccessMessage("آواتار فعال به‌روزرسانی شد.");
        }
    } catch (e: any) {
        setError(e.message || "خطا در تنظیم آواتار.");
    } finally {
        setFormIsLoading(false);
    }
  };
  
  const handleSaveHandle = async () => {
    const newHandleCoreValue = localHandleInputValue.trim();

    if (!newHandleCoreValue) {
        setError("نام کاربری (هندل و ورود) نمی‌تواند خالی باشد.");
        return;
    }
     if (!/^[a-zA-Z0-9_]+$/.test(newHandleCoreValue)) {
        setError("نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و خط زیر (_) باشد.");
        return;
    }

    const prospectiveHandleWithAt = `@${newHandleCoreValue}`;
    const currentEffectiveUsername = currentUser.handle ? currentUser.handle.substring(1) : currentUser.username;

    if (newHandleCoreValue === currentEffectiveUsername) {
        setSuccessMessage("نام کاربری بدون تغییر باقی ماند.");
        setError(null);
        return;
    }
    
    const confirmChange = window.confirm(
        `نام کاربری ورود شما به '${newHandleCoreValue}' و نام کاربری نمایشی شما به '${prospectiveHandleWithAt}' تغییر خواهند کرد. آیا ادامه می‌دهید؟`
    );
    if (!confirmChange) return;

    setFormIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
        const updatedUser = await onUpdateProfile({ handle: prospectiveHandleWithAt });
        if (updatedUser) {
            setLocalHandleInputValue(updatedUser.handle ? updatedUser.handle.substring(1) : (updatedUser.username || ''));
            setSuccessMessage("نام کاربری و نام کاربری نمایشی با موفقیت به‌روزرسانی شدند.");
        }
    } catch (e: any) {
        setError(e.message || "خطا در به‌روزرسانی نام کاربری.");
    } finally {
        setFormIsLoading(false);
    }
  };

  const handleSaveProfileDetails = async () => {
    setFormIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
        const payload: Parameters<typeof onUpdateProfile>[0] = {
            firstName: firstName.trim() === '' ? undefined : firstName.trim(),
            lastName: lastName.trim() === '' ? undefined : lastName.trim(),
            searchableByName: searchableByName,
            country: country === '' ? undefined : country, 
            dateOfBirth: dateOfBirth.trim() === '' ? undefined : dateOfBirth.trim(),
            gender: gender === '' ? 'prefer_not_to_say' : gender, 
            bio: bio.trim() === '' ? undefined : bio.trim(), 
        };
        const updatedUser = await onUpdateProfile(payload);
        if (updatedUser) {
            setFirstName(updatedUser.firstName || '');
            setLastName(updatedUser.lastName || '');
            setSearchableByName(updatedUser.searchableByName || false);
            setCountry(updatedUser.country || '');
            setDateOfBirth(updatedUser.dateOfBirth || '');
            setGender(updatedUser.gender || '');
            setBio(updatedUser.bio || ''); 
            setSuccessMessage("اطلاعات پروفایل با موفقیت به‌روزرسانی شد.");
        }
    } catch (e: any) {
        setError(e.message || "خطا در به‌روزرسانی اطلاعات پروفایل.");
    } finally {
        setFormIsLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) onClose();
  };

  const UserListItem = ({ userId, onAction, actionLabel }: { userId: string, onAction: (id: string) => void, actionLabel: string }) => {
      const user = allUsers.find(u => u.id === userId);
      if (!user) return <li className="text-xs text-slate-400">کاربر یافت نشد.</li>;

      const displayName = user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username);
      
      return (
          <li className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md">
              <button onClick={() => onViewUserProfile(user)} className="flex items-center min-w-0 text-right group">
                  {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover mr-2" />
                  ) : (
                      <span className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 mr-2"><i className="fas fa-user text-sm"></i></span>
                  )}
                  <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-700 truncate group-hover:underline">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.handle || `@${user.username}`}</p>
                  </div>
              </button>
              <button onClick={() => onAction(userId)} className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">{actionLabel}</button>
          </li>
      );
  };
  
  const RequestListItem = ({ userId }: { userId: string }) => {
      const user = allUsers.find(u => u.id === userId);
      if (!user) return <li className="text-xs text-slate-400">کاربر درخواست دهنده یافت نشد.</li>;

      const displayName = user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username);
      
      return (
          <li className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md">
              <button onClick={() => onViewUserProfile(user)} className="flex items-center min-w-0 text-right group">
                 {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover mr-2" />
                  ) : (
                      <span className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 mr-2"><i className="fas fa-user text-sm"></i></span>
                  )}
                  <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-700 truncate group-hover:underline">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.handle || `@${user.username}`}</p>
                  </div>
              </button>
              <div className="flex space-x-2 space-x-reverse">
                  <button onClick={() => onDeclineFollowRequest(userId)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">رد</button>
                  <button onClick={() => onAcceptFollowRequest(userId)} className="text-xs px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600">پذیرش</button>
              </div>
          </li>
      );
  }

  if (!isOpen) return null;
  const totalLoading = formIsLoading || appIsLoading;
  
  const pendingRequestsCount = currentUser.pendingFollowRequests?.length || 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[80] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-manager-title"
    >
      <div
        ref={modalRef}
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all text-right"
        tabIndex={-1}
      >
        <header className="p-5 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center sticky top-0 z-10">
          <h2 id="profile-manager-title" className="text-2xl font-semibold text-slate-800">
            <i className="fas fa-user-cog ml-2 text-purple-500"></i>مدیریت پروفایل
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-full p-1 -mr-2"
            aria-label="بستن مدیریت پروفایل"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>
        
        <div className="border-b border-slate-200 px-2 sm:px-4 bg-white">
            <nav className="flex space-x-2 space-x-reverse" aria-label="Tabs">
                <button onClick={() => setActiveTab('details')} className={clsx('px-3 py-3 text-sm font-medium whitespace-nowrap', activeTab === 'details' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700')}>مشخصات</button>
                <button onClick={() => setActiveTab('followers')} className={clsx('px-3 py-3 text-sm font-medium whitespace-nowrap', activeTab === 'followers' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700')}>دنبال‌کنندگان ({currentUser.followers?.length || 0})</button>
                <button onClick={() => setActiveTab('following')} className={clsx('px-3 py-3 text-sm font-medium whitespace-nowrap', activeTab === 'following' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700')}>دنبال‌شوندگان ({currentUser.following?.length || 0})</button>
                <button onClick={() => setActiveTab('requests')} className={clsx('relative px-3 py-3 text-sm font-medium whitespace-nowrap', activeTab === 'requests' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700')}>
                    درخواست‌ها
                    {pendingRequestsCount > 0 && <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{pendingRequestsCount}</span>}
                </button>
            </nav>
        </div>


        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
          {error && <div className="bg-red-100 border-r-4 border-red-500 text-red-700 px-4 py-3 rounded-md text-sm mb-4 sticky top-0 z-20" role="alert"><p className="font-bold">خطا</p><p>{error}</p></div>}
          {successMessage && <div className="bg-green-100 border-r-4 border-green-500 text-green-700 px-4 py-3 rounded-md text-sm mb-4 sticky top-0 z-20" role="alert"><p className="font-bold">موفقیت</p><p>{successMessage}</p></div>}
          
          {activeTab === 'details' && (
            <div className="space-y-6">
                 <fieldset className="bg-white p-5 rounded-lg shadow-md">
                    <legend className="text-lg font-semibold text-purple-600 px-2 mb-3"><i className="fas fa-id-card ml-2"></i>اطلاعات حساب کاربری</legend>
                    <div className="mb-4">
                        <label htmlFor="userHandle" className="block text-sm font-medium text-slate-700 mb-1">نام کاربری شما (برای ورود و نمایش)</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 mt-1 text-sm text-slate-500 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md">@</span>
                            <input ref={handleInputRef} type="text" id="userHandle" value={localHandleInputValue} onChange={(e) => setLocalHandleInputValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-r-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-900" placeholder="نام کاربری یکتا" disabled={totalLoading} />
                            <button type="button" onClick={handleSaveHandle} disabled={totalLoading} className="mr-2 mt-1 px-3 py-2 text-xs font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400 disabled:opacity-50 whitespace-nowrap">{formIsLoading && !appIsLoading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save ml-1"></i> ذخیره</>}</button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">این نام برای ورود و منشن کردن شما استفاده می‌شود. باید یکتا باشد (فقط حروف انگلیسی، عدد، _).</p>
                    </div>
                </fieldset>
                <fieldset className="bg-white p-5 rounded-lg shadow-md">
                    <legend className="text-lg font-semibold text-purple-600 px-2 mb-4"><i className="fas fa-address-book ml-2"></i>مشخصات فردی</legend>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                            <div><label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">نام</label><input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="نام کوچک" disabled={totalLoading} /></div>
                            <div><label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی</label><input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="نام خانوادگی" disabled={totalLoading} /></div>
                            <div><label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">تاریخ تولد</label><input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} disabled={totalLoading} /></div>
                            <div><label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">کشور</label><select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} appearance-auto`} disabled={totalLoading}>{countriesList.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
                            <div className="sm:col-span-2"><label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">جنسیت</label><select id="gender" value={gender} onChange={(e) => setGender(e.target.value as GenderOption)} className={`${inputClass} appearance-auto`} disabled={totalLoading}>{genderOptionsList.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}</select></div>
                        </div>
                        <div><label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">درباره من (بیوگرافی کوتاه)</label><textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${inputClass} min-h-[60px]`} placeholder="یک متن کوتاه درباره خودتان بنویسید..." maxLength={200} disabled={totalLoading} /><p className="text-xs text-slate-500 mt-1">حداکثر ۲۰۰ کاراکتر.</p></div>
                        <div className="flex items-center justify-end pt-2"><input type="checkbox" id="searchableByName" checked={searchableByName} onChange={(e) => setSearchableByName(e.target.checked)} className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 ml-2" disabled={totalLoading} /><label htmlFor="searchableByName" className="text-sm font-medium text-slate-700">به دیگران اجازه بده مرا با نام و نام خانوادگی جستجو کنند</label></div>
                        <div className="flex justify-end pt-2"><button type="button" onClick={handleSaveProfileDetails} disabled={totalLoading} className="w-full sm:w-auto mt-2 px-5 py-2 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400 disabled:opacity-50 flex items-center justify-center">{formIsLoading && !appIsLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}ذخیره مشخصات فردی</button></div>
                    </div>
                </fieldset>
                <fieldset className="bg-white p-5 rounded-lg shadow-md">
                    <legend className="text-lg font-semibold text-purple-600 px-2 mb-4"><i className="fas fa-image ml-2"></i>تصاویر پروفایل</legend>
                    <label htmlFor="profileImageUpload" className={`w-full text-center block sm:inline-block sm:w-auto mb-4 px-5 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors cursor-pointer ${totalLoading ? 'opacity-50 cursor-not-allowed' : ''}`}><i className="fas fa-upload ml-2"></i> بارگذاری تصویر جدید (تا ۲مگ)</label>
                    <input ref={fileInputRef} type="file" id="profileImageUpload" accept="image/*" onChange={handleProfileImageUpload} className="hidden" disabled={totalLoading} />
                    {profileImages.length === 0 && !formIsLoading && ( <p className="text-sm text-slate-500 text-center">هنوز تصویری بارگذاری نکرده‌اید.</p>)}
                    {formIsLoading && !appIsLoading && profileImages.length === 0 && <div className="text-center py-2"><i className="fas fa-spinner fa-spin text-purple-500"></i><span className="text-sm text-slate-600 mr-2">در حال پردازش...</span></div>}
                    {profileImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-72 overflow-y-auto pr-1 py-1">
                        {profileImages.map((img) => (
                          <div key={img.id} className={`relative group border-2 rounded-lg overflow-hidden shadow-sm aspect-square ${activeAvatarId === img.id ? 'border-purple-600 ring-2 ring-purple-400' : 'border-slate-200'}`}>
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex flex-col items-center justify-center p-1 space-y-1.5">
                              {activeAvatarId !== img.id && (<button type="button" onClick={() => handleSetAvatar(img.id)} disabled={totalLoading} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 transition-all" aria-label="انتخاب به عنوان آواتار"><i className="fas fa-check-circle mr-1"></i> انتخاب</button>)}
                              <button type="button" onClick={() => handleDeleteProfileImage(img.id)} disabled={totalLoading} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 transition-all" aria-label="حذف تصویر"><i className="fas fa-trash mr-1"></i> حذف</button>
                            </div>
                            {activeAvatarId === img.id && (<div className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full shadow-md" title="آواتار فعال"><i className="fas fa-star text-xs"></i></div>)}
                          </div>
                        ))}
                      </div>
                    )}
                </fieldset>
            </div>
          )}

          {activeTab === 'followers' && (
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">کسانی که شما را دنبال می‌کنند</h3>
                  {(currentUser.followers?.length || 0) === 0 ? <p className="text-sm text-slate-500">هنوز کسی شما را دنبال نکرده است.</p> :
                      <ul className="space-y-2">{currentUser.followers?.map(userId => <UserListItem key={userId} userId={userId} onAction={()=>{}} actionLabel="" />)}</ul> // No action for followers list for now
                  }
              </div>
          )}

          {activeTab === 'following' && (
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">کسانی که شما دنبال می‌کنید</h3>
                  {(currentUser.following?.length || 0) === 0 ? <p className="text-sm text-slate-500">شما هنوز کسی را دنبال نکرده‌اید.</p> :
                      <ul className="space-y-2">{currentUser.following?.map(userId => <UserListItem key={userId} userId={userId} onAction={onUnfollow} actionLabel="آنفالو" />)}</ul>
                  }
              </div>
          )}
            
          {activeTab === 'requests' && (
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">درخواست‌های دنبال کردن</h3>
                  {pendingRequestsCount === 0 ? <p className="text-sm text-slate-500">شما هیچ درخواست جدیدی ندارید.</p> :
                      <ul className="space-y-2">{currentUser.pendingFollowRequests?.map(userId => <RequestListItem key={userId} userId={userId} />)}</ul>
                  }
              </div>
          )}

        </div>

        <footer className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end sticky bottom-0 z-10">
          <button onClick={onClose} disabled={totalLoading} className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors disabled:opacity-50">
            بستن
          </button>
        </footer>
      </div>
    </div>
  );
};


export default ProfileManager;