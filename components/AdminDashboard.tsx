
import React, { useState, useEffect } from 'react';
import { User, AdminDashboardStats, ChatSettings } from '../types';
import { USER_ROLES } from '../constants';
import { fetchUsersForAdmin, adminUpdateUser, adminResetUserPassword } from '../services/authService';
import { getAdminDashboardStats } from '../services/dataService';
import * as chatService from '../services/chatService';
import UserActivityDiagram from './UserActivityDiagram';
import clsx from 'clsx';
import UserEditModal from './UserEditModal';

// Import Sub-components
import UserList from './admin/UserList';
import CreateUserForm from './admin/CreateUserForm';
import UserRolesManagement from './admin/UserRolesManagement';
import ChatManagement from './admin/ChatManagement';

const StatCard: React.FC<{ title: string; value: string | number; icon: string; colorClass: string; isLoading?: boolean }> = ({ title, value, icon, colorClass, isLoading }) => (
  <div className={`bg-white p-5 rounded-xl shadow-md border-r-4 ${colorClass}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-bold text-slate-800">
          {isLoading ? <i className="fas fa-spinner fa-spin"></i> : value}
        </p>
        <p className="text-sm text-slate-500">{title}</p>
      </div>
      <div className={`text-3xl ${colorClass.replace('border-', 'text-').replace('-500', '-600')}`}>
        <i className={icon}></i>
      </div>
    </div>
  </div>
);

const HighlightUserCard: React.FC<{ title: string; userActivity?: { userId: string; username: string; handle?: string; avatarUrl?: string; firstName?: string; lastName?: string; shareCount?: number; receiveCount?: number; }; onUserClick: (userId: string) => void; isLoading?: boolean; type: 'sharer' | 'recipient' }> = ({ title, userActivity, onUserClick, isLoading, type }) => {
  if (isLoading) return <div className="bg-white p-5 rounded-xl shadow-md text-center"><i className="fas fa-spinner fa-spin text-purple-500 text-2xl"></i></div>;
  if (!userActivity) return <div className="bg-white p-5 rounded-xl shadow-md"><p className="text-slate-500 text-sm text-center">{title}: یافت نشد</p></div>;

  const displayName = userActivity.firstName || userActivity.lastName ? `${userActivity.firstName || ''} ${userActivity.lastName || ''}`.trim() : (userActivity.handle || userActivity.username);
  const displayHandle = userActivity.handle || `@${userActivity.username}`;
  const count = type === 'sharer' ? userActivity.shareCount : userActivity.receiveCount;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md">
      <h4 className="text-md font-semibold text-purple-600 mb-3">{title}:</h4>
      <button onClick={() => onUserClick(userActivity.userId)} className="flex items-center space-x-3 space-x-reverse w-full text-right hover:bg-purple-50 p-2 rounded-md transition-colors group">
        {userActivity.avatarUrl ? (
          <img src={userActivity.avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-400" />
        ) : (
          <span className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xl border-2 border-purple-200 group-hover:border-purple-400">
            <i className="fas fa-user"></i>
          </span>
        )}
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-slate-700 truncate group-hover:text-purple-700">{displayName}</p>
          <p className="text-xs text-slate-500 truncate group-hover:text-purple-600">{displayHandle}</p>
          <p className="text-xs text-purple-500 mt-0.5">
            {type === 'sharer' ? `${count} مورد اشتراک‌گذاری` : `${count} مورد دریافت اشتراک`}
          </p>
        </div>
      </button>
    </div>
  );
};

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onViewUserProfile: (user: User) => void;
}

type AdminView = 'dashboard' | 'userList' | 'createUser' | 'userRoles' | 'chatManagement';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onViewUserProfile }) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat Management State
  const [chatConfig, setChatConfig] = useState<{ global: ChatSettings, userOverrides: Record<string, Partial<ChatSettings>> } | null>(null);

  // User Management State
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateUserError, setUpdateUserError] = useState<string | null>(null);
  const [updateUserSuccess, setUpdateUserSuccess] = useState<string | null>(null);

  const loadInitialData = async () => {
    if (currentUser.role !== USER_ROLES.ADMIN) return;
    setIsLoading(true);
    setError(null);
    try {
      // Re-fetch user list every time to ensure data is fresh for other operations
      const userList = await fetchUsersForAdmin(currentUser);
      setUsers(userList);

      const [stats, chatSettingsData] = await Promise.all([
        getAdminDashboardStats(userList),
        chatService.fetchChatConfigurationForAdmin()
      ]);
      setAdminStats(stats);
      setChatConfig(chatSettingsData);
    } catch (err: any) {
      setError(err.message || "Failed to load initial admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const handleAdminUpdateUser = async (targetUserId: string, payload: any) => {
    setIsUpdatingUser(true);
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    try {
      await adminUpdateUser(currentUser, targetUserId, payload);
      setUpdateUserSuccess("کاربر با موفقیت به‌روزرسانی شد.");
      setUserToEdit(null); // Close modal on success
      await loadInitialData(); // Refresh all data
    } catch (e: any) {
      setUpdateUserError(e.message || "خطا در به‌روزرسانی کاربر.");
      // Don't close modal on error, so admin can fix it.
      return Promise.reject(e); // Propagate error to modal if needed
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleAdminResetPassword = async (targetUserId: string, newPassword: string) => {
    setIsUpdatingUser(true);
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    try {
      await adminResetUserPassword(currentUser, targetUserId, newPassword);
      setUpdateUserSuccess("رمز عبور کاربر با موفقیت تغییر کرد.");
    } catch (e: any) {
      setUpdateUserError(e.message || "خطا در تغییر رمز عبور.");
      return Promise.reject(e);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleHighlightUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      onViewUserProfile(user);
    }
  };

  if (currentUser.role !== 'admin') {
    return <p>Access Denied. You must be an admin to view this page.</p>;
  }

  const DashboardView = () => (
    <div className="space-y-8">
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="تعداد کاربران (عادی)" value={isLoading ? "..." : (adminStats?.totalUsers ?? 0)} icon="fas fa-users" colorClass="border-sky-500" isLoading={isLoading} />
          <StatCard title="مجموع خاطرات سفر" value={isLoading ? "..." : (adminStats?.totalMemories ?? 0)} icon="fas fa-route" colorClass="border-teal-500" isLoading={isLoading} />
          <StatCard title="مجموع رویدادهای روزنگار" value={isLoading ? "..." : (adminStats?.totalChronicleEvents ?? 0)} icon="fas fa-calendar-alt" colorClass="border-emerald-500" isLoading={isLoading} />
          <StatCard title="میانگین آیتم‌ها به ازای هر کاربر" value={isLoading ? "..." : (adminStats?.averageItemsPerUser?.toFixed(1) ?? 0)} icon="fas fa-chart-pie" colorClass="border-indigo-500" isLoading={isLoading} />
          <StatCard title="درصد اشتراک خاطرات" value={isLoading ? "..." : `${adminStats?.percentageSharedMemories?.toFixed(1) ?? 0}%`} icon="fas fa-share-square" colorClass="border-blue-500" isLoading={isLoading} />
          <StatCard title="درصد اشتراک روزنگارها" value={isLoading ? "..." : `${adminStats?.percentageSharedChronicleEvents?.toFixed(1) ?? 0}%`} icon="fas fa-share-nodes" colorClass="border-cyan-500" isLoading={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <HighlightUserCard title="فعال‌ترین کاربر در اشتراک‌گذاری" userActivity={adminStats?.mostActiveSharer} onUserClick={handleHighlightUserClick} isLoading={isLoading} type="sharer" />
          <HighlightUserCard title="محبوب‌ترین کاربر (دریافت اشتراک)" userActivity={adminStats?.mostFrequentRecipient} onUserClick={handleHighlightUserClick} isLoading={isLoading} type="recipient" />
        </div>
      </section>
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-semibold text-slate-700 mb-4">نمودار فعالیت کاربران</h3>
        {isLoading && <p className="text-center py-4 text-slate-600"><i className="fas fa-spinner fa-spin mr-2"></i>در حال بارگذاری آمار فعالیت...</p>}
        {!isLoading && adminStats && adminStats.userActivityStats.length > 0 && <UserActivityDiagram stats={adminStats} onViewUserProfile={onViewUserProfile} />}
        {!isLoading && adminStats && adminStats.userActivityStats.length === 0 && !error && <p className="text-slate-500 text-center py-4">اطلاعات آماری برای نمایش فعالیت کاربران وجود ندارد.</p>}
      </section>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800" dir="rtl">
      {/* --- Sidebar --- */}
      <aside className="w-64 flex-shrink-0 bg-slate-800 text-slate-200 flex flex-col p-4 shadow-2xl">
        <div className="text-center py-4 mb-4">
          <h2 className="text-2xl font-semibold text-white">
            <i className="fas fa-shield-halved ml-2 text-sky-400"></i>پنل مدیریت
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ورود با: {currentUser.handle || currentUser.username}
          </p>
        </div>

        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveView('dashboard')}
                className={clsx('w-full flex items-center p-3 rounded-lg transition-colors',
                  activeView === 'dashboard' ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-700'
                )}
              >
                <i className="fas fa-tachometer-alt ml-3 w-5 text-center"></i>
                <span>داشبورد</span>
              </button>
            </li>

            <li className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">مدیریت کاربران</li>

            <li>
              <button
                onClick={() => setActiveView('userList')}
                className={clsx('w-full flex items-center p-3 rounded-lg transition-colors',
                  activeView === 'userList' ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-700'
                )}
              >
                <i className="fas fa-users ml-3 w-5 text-center"></i>
                <span>لیست کاربران</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('createUser')}
                className={clsx('w-full flex items-center p-3 rounded-lg transition-colors',
                  activeView === 'createUser' ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-700'
                )}
              >
                <i className="fas fa-user-plus ml-3 w-5 text-center"></i>
                <span>ایجاد کاربر</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('userRoles')}
                className={clsx('w-full flex items-center p-3 rounded-lg transition-colors',
                  activeView === 'userRoles' ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-700'
                )}
              >
                <i className="fas fa-user-tag ml-3 w-5 text-center"></i>
                <span>نقش‌ها و دسترسی‌ها</span>
              </button>
            </li>

            <li className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">تنظیمات سیستم</li>

            <li>
              <button
                onClick={() => setActiveView('chatManagement')}
                className={clsx('w-full flex items-center p-3 rounded-lg transition-colors',
                  activeView === 'chatManagement' ? 'bg-sky-600 text-white shadow-lg' : 'hover:bg-slate-700'
                )}
              >
                <i className="fas fa-comments-cog ml-3 w-5 text-center"></i>
                <span>مدیریت چت</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors text-red-400 hover:bg-red-500 hover:text-white"
          >
            <i className="fas fa-sign-out-alt ml-3 w-5 text-center"></i>
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-700">
            {activeView === 'dashboard' && 'داشبورد و آمار کلی'}
            {activeView === 'userList' && 'لیست کاربران'}
            {activeView === 'createUser' && 'ایجاد کاربر جدید'}
            {activeView === 'userRoles' && 'مدیریت نقش‌ها و دسترسی‌ها'}
            {activeView === 'chatManagement' && 'مدیریت تنظیمات چت'}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeView === 'dashboard' && 'نمای کلی از فعالیت‌های سیستم.'}
            {activeView === 'userList' && 'مشاهده و مدیریت لیست تمام کاربران.'}
            {activeView === 'createUser' && 'افزودن کاربر جدید به سیستم.'}
            {activeView === 'userRoles' && 'تغییر نقش کاربران و مسدودسازی دسترسی.'}
            {activeView === 'chatManagement' && 'کنترل دسترسی‌ها و قابلیت‌های سیستم چت.'}
          </p>
        </header>

        {error && <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-lg" role="alert"><p className="font-bold">خطا</p><p>{error}</p></div>}

        {isLoading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-sky-500"></i>
            <p className="mt-3 text-slate-600">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'userList' && (
              <UserList
                users={users}
                isLoading={isLoading}
                onViewUserProfile={onViewUserProfile}
                onEditUser={setUserToEdit}
              />
            )}
            {activeView === 'createUser' && (
              <CreateUserForm
                currentUser={currentUser}
                onUserCreated={loadInitialData}
              />
            )}
            {activeView === 'userRoles' && (
              <UserRolesManagement
                users={users}
                currentUser={currentUser}
                onUserUpdated={loadInitialData}
              />
            )}
            {activeView === 'chatManagement' && (
              <ChatManagement
                chatConfig={chatConfig}
                setChatConfig={setChatConfig}
                users={users}
              />
            )}
          </>
        )}
      </main>

      {userToEdit && (
        <UserEditModal
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          user={userToEdit}
          onSave={handleAdminUpdateUser}
          isSaving={isUpdatingUser}
          error={updateUserError}
          success={updateUserSuccess}
          clearMessages={() => { setUpdateUserError(null); setUpdateUserSuccess(null); }}
          onResetPassword={handleAdminResetPassword}
        />
      )}
    </div>
  );
};

export default AdminDashboard;