
import React, { useState, useEffect, useRef } from 'react';
import { User, GenderOption } from '../types';
import { countriesList } from '../utils/countryUtils';
import { genderOptionsList } from '../utils/genderUtils';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (userId: string, payload: Partial<User>) => Promise<any>;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
  onResetPassword?: (userId: string, newPassword: string) => Promise<any>;
}

const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400";

const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isSaving,
  error,
  success,
  clearMessages,
  onResetPassword
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<GenderOption>('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [searchableByName, setSearchableByName] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const modalRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '');
      setCountry(user.country || '');
      setGender(user.gender as GenderOption || 'prefer_not_to_say');
      setBio(user.bio || '');
      setRole(user.role as 'admin' | 'user');
      setSearchableByName(user.searchableByName || false);
    }
  }, [user]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      clearMessages();
      setNewPassword('');
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, clearMessages]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current.parentElement) {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      country,
      gender,
      bio: bio.trim(),
      role,
      searchableByName,
    };
    try {
      await onSave(user.id, payload);
    } catch (e) {
      // Error is handled by parent and passed back as prop
    }
  };

  const handlePasswordReset = async () => {
    if (!onResetPassword || !newPassword) return;
    try {
      await onResetPassword(user.id, newPassword);
      setNewPassword('');
    } catch (e) {
      // Error handled by parent
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-edit-modal-title"
    >
      <form
        ref={modalRef}
        onSubmit={handleSave}
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all text-right"
      >
        <header className="p-5 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center sticky top-0 z-10">
          <h2 id="user-edit-modal-title" className="text-xl font-semibold text-slate-800">
            ویرایش کاربر: <span className="text-indigo-600">{user.handle || user.username}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 -mr-2"
            aria-label="بستن مودال ویرایش"
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-6 space-y-5 flex-grow overflow-y-auto">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm" role="alert"><p className="font-bold">خطا</p><p>{error}</p></div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md text-sm" role="alert"><p className="font-bold">موفقیت</p><p>{success}</p></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="edit-firstName" className="block text-sm font-medium text-slate-700 mb-1">نام</label>
              <input type="text" id="edit-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="edit-lastName" className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی</label>
              <input type="text" id="edit-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="edit-dob" className="block text-sm font-medium text-slate-700 mb-1">تاریخ تولد</label>
              <input type="date" id="edit-dob" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="edit-country" className="block text-sm font-medium text-slate-700 mb-1">کشور</label>
              <select id="edit-country" value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} appearance-auto`} disabled={isSaving}>
                {countriesList.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="edit-gender" className="block text-sm font-medium text-slate-700 mb-1">جنسیت</label>
              <select id="edit-gender" value={gender} onChange={(e) => setGender(e.target.value as GenderOption)} className={`${inputClass} appearance-auto`} disabled={isSaving}>
                {genderOptionsList.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700 mb-1">نقش کاربری</label>
              <select id="edit-role" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')} className={`${inputClass} appearance-auto`} disabled={isSaving}>
                <option value="user">کاربر</option>
                <option value="admin">ادمین</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="edit-bio" className="block text-sm font-medium text-slate-700 mb-1">بیوگرافی</label>
              <textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass} disabled={isSaving} />
            </div>
          </div>
          <div className="flex items-center pt-3 border-t border-slate-200">
            <input type="checkbox" id="edit-searchable" checked={searchableByName} onChange={(e) => setSearchableByName(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 ml-2" disabled={isSaving} />
            <label htmlFor="edit-searchable" className="text-sm font-medium text-slate-700">قابل جستجو توسط دیگران با نام و نام خانوادگی</label>
          </div>

          {onResetPassword && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <h3 className="text-md font-semibold text-slate-700 mb-3">تغییر رمز عبور</h3>
              <div className="flex items-end gap-3">
                <div className="flex-grow">
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">رمز عبور جدید</label>
                  <input
                    type="text"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="رمز عبور جدید را وارد کنید"
                    disabled={isSaving}
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isSaving || !newPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 mb-[1px]"
                >
                  تغییر رمز
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end space-x-3 space-x-reverse sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
          >
            {isSaving ? <><i className="fas fa-spinner fa-spin ml-2"></i>در حال ذخیره</> : <><i className="fas fa-save ml-2"></i>ذخیره تغییرات</>}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default UserEditModal;
