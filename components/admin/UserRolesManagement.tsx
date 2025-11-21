
import React, { useState } from 'react';
import { User } from '../../types';
import { adminBanUser } from '../../services/authService';

interface UserRolesManagementProps {
    users: User[];
    currentUser: User;
    onUserUpdated: () => void;
}

const UserRolesManagement: React.FC<UserRolesManagementProps> = ({ users, currentUser, onUserUpdated }) => {
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleToggleBan = async (user: User) => {
        if (user.id === currentUser.id) {
            setError("شما نمی‌توانید خودتان را مسدود کنید.");
            return;
        }
        setUpdatingUserId(user.id);
        setError(null);
        try {
            await adminBanUser(currentUser, user.id, !user.isBanned);
            onUserUpdated();
        } catch (err: any) {
            setError(err.message || "خطا در تغییر وضعیت کاربر.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-lg">
            <header className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-semibold text-slate-700">مدیریت نقش‌ها و دسترسی‌ها</h3>
                <p className="text-sm text-slate-500 mt-1">در اینجا می‌توانید کاربران را مسدود کنید یا نقش آن‌ها را تغییر دهید (در آینده).</p>
            </header>
            <div className="p-6">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mb-4" role="alert"><p className="font-bold">خطا</p><p>{error}</p></div>}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">کاربر</th>
                                <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">نقش فعلی</th>
                                <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">وضعیت</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-slate-900">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="flex items-center">
                                            {user.avatarUrl ? (
                                                <img className="h-8 w-8 rounded-full ml-2" src={user.avatarUrl} alt="" />
                                            ) : (
                                                <span className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 text-slate-500"><i className="fas fa-user"></i></span>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">{user.handle || user.username}</div>
                                                <div className="text-slate-500 text-xs">{user.firstName} {user.lastName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                        {user.role === 'admin' ? 'ادمین' : 'کاربر'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {user.isBanned ? (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                مسدود شده
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                فعال
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-left">
                                        <button
                                            onClick={() => handleToggleBan(user)}
                                            disabled={updatingUserId === user.id || user.id === currentUser.id}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${user.isBanned
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {updatingUserId === user.id ? '...' : (user.isBanned ? 'رفع مسدودیت' : 'مسدود کردن')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default UserRolesManagement;
