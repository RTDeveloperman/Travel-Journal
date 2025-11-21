

import React from 'react';
import { AdminDashboardStats, UserActivityStat, User } from '../types';

interface UserActivityDiagramProps {
  stats: AdminDashboardStats; // Now expecting the full stats object
  onViewUserProfile: (user: User) => void;
}

const UserActivityDiagram: React.FC<UserActivityDiagramProps> = ({ stats, onViewUserProfile }) => {
  // We'll use userActivityStats directly from the stats prop.
  const { userActivityStats } = stats;

  const maxItemsPerUser = Math.max(
    1, 
    ...userActivityStats.map(stat => stat.memoriesCreatedCount + stat.chronicleEventsCreatedCount)
  );


  return (
    <div className="space-y-6">
      {/* Removed the overall stat cards from here as they are now in AdminDashboard */}
      
      {userActivityStats.length === 0 && <p className="text-slate-500">هیچ فعالیت کاربری برای نمایش وجود ندارد.</p>}
      
      <div className="space-y-4">
        {userActivityStats.map(stat => (
          <div key={stat.user.id} className="bg-slate-50 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
              <div className="flex items-center mb-2 sm:mb-0">
                 <button 
                    type="button" 
                    onClick={() => onViewUserProfile(stat.user)} 
                    className="flex items-center group"
                    aria-label={`مشاهده پروفایل ${stat.user.username}`}
                >
                    {stat.user.avatarUrl ? (
                    <img src={stat.user.avatarUrl} alt={stat.user.username} className="w-10 h-10 rounded-full mr-3 object-cover group-hover:ring-2 group-hover:ring-purple-400"/>
                    ) : (
                    <span className="w-10 h-10 rounded-full mr-3 bg-slate-300 flex items-center justify-center text-slate-500 text-lg group-hover:ring-2 group-hover:ring-purple-400">
                        <i className="fas fa-user"></i>
                    </span>
                    )}
                    <div className="text-right">
                    <p className="font-semibold text-purple-700 text-lg group-hover:underline group-hover:text-purple-800">
                        {stat.user.firstName || stat.user.lastName ? `${stat.user.firstName || ''} ${stat.user.lastName || ''}`.trim() : (stat.user.handle || stat.user.username)}
                    </p>
                    <p className="text-xs text-slate-500 group-hover:text-purple-600">
                        {stat.user.handle && (stat.user.firstName || stat.user.lastName) ? stat.user.handle : `@${stat.user.username}`}
                    </p>
                    </div>
                </button>
              </div>
              <div className="text-xs text-slate-600 text-left sm:text-right">
                <p>مجموع آیتم‌های دریافتی: <span className="font-bold">{stat.receivedShareCount}</span></p>
                <p>مجموع آیتم‌های اشتراک‌گذاشته: <span className="font-bold">{stat.sharedItemCount}</span></p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600">خاطرات سفر ثبت شده: </span>
                <span className="font-bold text-teal-600">{stat.memoriesCreatedCount}</span>
                {stat.memoriesCreatedCount > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                      className="bg-teal-500 h-2.5 rounded-full" 
                      style={{ width: `${(stat.memoriesCreatedCount / maxItemsPerUser) * 100}%` }}
                      title={`${stat.memoriesCreatedCount} خاطره`}
                    ></div>
                  </div>
                )}
              </div>
              <div>
                <span className="text-slate-600">رویدادهای روزنگار ثبت شده: </span>
                <span className="font-bold text-emerald-600">{stat.chronicleEventsCreatedCount}</span>
                 {stat.chronicleEventsCreatedCount > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div 
                        className="bg-emerald-500 h-2.5 rounded-full" 
                        style={{ width: `${(stat.chronicleEventsCreatedCount / maxItemsPerUser) * 100}%` }}
                        title={`${stat.chronicleEventsCreatedCount} رویداد`}
                        ></div>
                    </div>
                )}
              </div>
            </div>

            {stat.sharedWithUsers.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-1">اشتراک گذاشته شده با:</p>
                <div className="flex flex-wrap gap-1 justify-end">
                  {stat.sharedWithUsers.map(sharedUser => {
                     // Attempt to find full user details for the shared user from the main list if available
                    const fullSharedUserDetails = stats.userActivityStats.find(s => s.user.id === sharedUser.userId)?.user;
                    const userToView = fullSharedUserDetails || { 
                        id: sharedUser.userId, 
                        username: sharedUser.username, 
                        handle: sharedUser.handle, 
                        role: 'user', // Fallback role
                        avatarUrl: sharedUser.avatarUrl,
                        firstName: sharedUser.firstName,
                        lastName: sharedUser.lastName,
                    };

                    return (
                        <button
                            key={sharedUser.userId}
                            type="button"
                            onClick={() => onViewUserProfile(userToView)}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-200 hover:text-purple-800 hover:underline"
                            aria-label={`مشاهده پروفایل ${sharedUser.handle || sharedUser.username}`}
                        >
                        {sharedUser.handle || sharedUser.username}
                        </button>
                    );
                  })}
                </div>
              </div>
            )}
             {stat.sharedWithUsers.length === 0 && stat.sharedItemCount > 0 && (
                 <p className="text-xs text-slate-400 mt-2 italic">(آیتم‌های اشتراک‌گذاشته شده این کاربر ممکن است با کاربرانی باشد که حذف شده‌اند یا دیگر در دسترس نیستند)</p>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserActivityDiagram;