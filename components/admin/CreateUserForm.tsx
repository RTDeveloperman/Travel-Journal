
import React, { useState } from 'react';
import { User, GenderOption } from '../../types';
import { adminCreateUser as adminCreateUserAPI } from '../../services/authService';
import { genderOptionsList } from '../../utils/genderUtils';
import { countriesList } from '../../utils/countryUtils';

interface CreateUserFormProps {
    currentUser: User;
    onUserCreated: () => void;
}

const inputFieldClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900";

const InputField: React.FC<{ label: string, id: string, value: string, onChange: (value: string) => void, placeholder?: string, type?: string, required?: boolean }> =
    ({ label, id, value, onChange, placeholder, type = "text", required = false }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <input type={type} id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputFieldClass} placeholder={placeholder} required={required} />
        </div>
    );

const CreateUserForm: React.FC<CreateUserFormProps> = ({ currentUser, onUserCreated }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newDateOfBirth, setNewDateOfBirth] = useState('');
    const [newCountry, setNewCountry] = useState('');
    const [newGender, setNewGender] = useState<GenderOption>('');
    const [newFirstName, setNewFirstName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newSearchableByName, setNewSearchableByName] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createUserError, setCreateUserError] = useState<string | null>(null);
    const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateUserError(null);
        setCreateUserSuccess(null);

        if (!newUsername.trim()) {
            setCreateUserError("نام کاربری برای کاربر جدید الزامی است.");
            return;
        }
        if (newDateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(newDateOfBirth)) {
            setCreateUserError("فرمت تاریخ تولد نامعتبر است. لطفاً از فرمت YYYY-MM-DD استفاده کنید.");
            return;
        }
        if (newDateOfBirth && isNaN(new Date(newDateOfBirth).getTime())) {
            setCreateUserError("تاریخ تولد وارد شده معتبر نیست.");
            return;
        }

        setIsCreatingUser(true);
        try {
            await adminCreateUserAPI(currentUser, {
                username: newUsername,
                dateOfBirth: newDateOfBirth || undefined,
                country: newCountry.trim() || undefined,
                gender: newGender || undefined,
                firstName: newFirstName.trim() || undefined,
                lastName: newLastName.trim() || undefined,
                searchableByName: newSearchableByName,
                bio: newBio.trim() || undefined,
            });
            setCreateUserSuccess(`کاربر '${newUsername}' با موفقیت ایجاد شد.`);
            // Reset form
            setNewUsername(''); setNewDateOfBirth(''); setNewCountry(''); setNewGender('');
            setNewFirstName(''); setNewLastName(''); setNewSearchableByName(false); setNewBio('');

            onUserCreated();
        } catch (err: any) {
            setCreateUserError(err.message || "Failed to create user.");
        } finally {
            setIsCreatingUser(false);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-lg">
            <header className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-semibold text-slate-700">ایجاد کاربر جدید</h3>
            </header>
            <div className="p-6">
                {createUserError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mb-4" role="alert"><p className="font-bold">خطا در ایجاد کاربر</p><p>{createUserError}</p></div>}
                {createUserSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md text-sm mb-4" role="alert"><p className="font-bold">موفقیت</p><p>{createUserSuccess}</p></div>}
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <InputField label="نام کاربری جدید" id="newUsername" value={newUsername} onChange={setNewUsername} placeholder="نام کاربری مورد نظر" required />
                        <InputField label="نام (اختیاری)" id="newFirstName" value={newFirstName} onChange={setNewFirstName} placeholder="نام کوچک" />
                        <InputField label="نام خانوادگی (اختیاری)" id="newLastName" value={newLastName} onChange={setNewLastName} placeholder="نام خانوادگی" />
                        <div>
                            <label htmlFor="newDateOfBirth" className="block text-sm font-medium text-slate-600 mb-1">تاریخ تولد (اختیاری)</label>
                            <input type="date" id="newDateOfBirth" value={newDateOfBirth} onChange={(e) => setNewDateOfBirth(e.target.value)} className={inputFieldClass} />
                        </div>
                        <div>
                            <label htmlFor="newCountry" className="block text-sm font-medium text-slate-600 mb-1">کشور (اختیاری)</label>
                            <select id="newCountry" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className={`${inputFieldClass} appearance-auto`}>
                                {[{ code: '', name: 'انتخاب کنید...' }, ...countriesList.filter(c => c.code !== '')].map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="newGender" className="block text-sm font-medium text-slate-600 mb-1">جنسیت (اختیاری)</label>
                            <select id="newGender" value={newGender} onChange={(e) => setNewGender(e.target.value as GenderOption)} className={`${inputFieldClass} appearance-auto`}>
                                {genderOptionsList.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="newBio" className="block text-sm font-medium text-slate-600 mb-1">بیوگرافی کوتاه (اختیاری)</label>
                            <textarea id="newBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={2} className={inputFieldClass} placeholder="درباره کاربر..." />
                        </div>
                    </div>
                    <div className="flex items-center mt-3">
                        <input type="checkbox" id="newSearchableByName" checked={newSearchableByName} onChange={(e) => setNewSearchableByName(e.target.checked)} className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 ml-2" />
                        <label htmlFor="newSearchableByName" className="text-sm font-medium text-slate-600">قابل جستجو با نام</label>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-slate-200">
                        <button type="submit" disabled={isCreatingUser} className="px-5 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 flex items-center">
                            {isCreatingUser ? <><i className="fas fa-spinner fa-spin ml-2"></i>صبر کنید...</> : <><i className="fas fa-user-plus ml-2"></i>ایجاد کاربر</>}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default CreateUserForm;
