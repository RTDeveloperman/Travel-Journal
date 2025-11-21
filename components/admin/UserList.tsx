
import React from 'react';
import { User } from '../../types';
import { USER_ROLES } from '../../constants';

interface UserListProps {
    users: User[];
    isLoading: boolean;
    onViewUserProfile: (user: User) => void;
    onEditUser: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, isLoading, onViewUserProfile, onEditUser }) => {
    return (
        <section className="bg-white rounded-xl shadow-lg">
            <header className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-semibold text-slate-700">
                    لیست کاربران سیستم ({users.filter(u => u.role !== 'admin').length} کاربر عادی, {users.filter(u => u.role === 'admin').length} ادمین)
                </h3>
            </header>
            <div className="p-6">
                {isLoading && !users.length ? (
                    <p className="text-center text-slate-600 py-4">در حال بارگذاری کاربران...</p>
                ) : users.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">کاربری یافت نشد.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">نام کاربری/هندل</th>
                                    <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900 hidden sm:table-cell">نام کامل</th>
                                    <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">نقش</th>
                                    <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">وضعیت</th>
                                    <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900 hidden md:table-cell">بیوگرافی</th>
                                    <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-slate-900 hidden lg:table-cell">خاطرات</th>
                                    <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-slate-900 hidden lg:table-cell">روزنگار</th>
                                    <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-slate-900">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users.map(user => (
                                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${user.isBanned ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <button
                                                type="button"
                                                onClick={() => onViewUserProfile(user)}
                                                className="font-medium text-sky-600 hover:text-sky-800 hover:underline"
                                                aria-label={`مشاهده پروفایل ${user.username}`}
                                            >
                                                {user.handle || user.username}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'}`}>
                                                {user.role === 'admin' ? 'ادمین' : 'کاربر'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {user.isBanned ? (
                                                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    مسدود شده
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    فعال
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate hidden md:table-cell" title={user.bio}>{user.bio || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center hidden lg:table-cell">
                                            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{user._count?.memories || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center hidden lg:table-cell">
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{user._count?.chronicleEvents || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-left">
                                            <button
                                                type="button"
                                                onClick={() => onEditUser(user)}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium disabled:opacity-50"
                                                aria-label={`ویرایش کاربر ${user.username}`}
                                            >
                                                ویرایش
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default UserList;
