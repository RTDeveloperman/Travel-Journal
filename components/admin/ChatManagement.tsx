
import React, { useState } from 'react';
import { User, ChatSettings } from '../../types';
import { USER_ROLES } from '../../constants';
import * as chatService from '../../services/chatService';
import clsx from 'clsx';

const inputFieldClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900";

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, checked, onChange, disabled }) => (
    <label className={clsx("flex items-center justify-between cursor-pointer py-2", disabled && "opacity-50 cursor-not-allowed")}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <div className="block bg-slate-300 w-12 h-6 rounded-full transition-colors"></div>
            <div className={clsx(
                "dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out",
                checked && "transform -translate-x-6 bg-teal-400"
            )}></div>
        </div>
    </label>
);

interface ChatManagementProps {
    chatConfig: { global: ChatSettings, userOverrides: Record<string, Partial<ChatSettings>> } | null;
    setChatConfig: React.Dispatch<React.SetStateAction<{ global: ChatSettings, userOverrides: Record<string, Partial<ChatSettings>> } | null>>;
    users: User[];
}

const ChatManagement: React.FC<ChatManagementProps> = ({ chatConfig, setChatConfig, users }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const handleGlobalSettingChange = async (key: keyof ChatSettings, value: boolean) => {
        if (!chatConfig) return;
        setIsUpdating(true);
        const newGlobalSettings = { ...chatConfig.global, [key]: value };
        await chatService.updateChatSettingsForUser('global', newGlobalSettings);
        setChatConfig(prev => prev ? { ...prev, global: newGlobalSettings } : null);
        setIsUpdating(false);
    };

    const handleUserOverrideChange = async (key: keyof ChatSettings, value: boolean) => {
        if (!chatConfig || !selectedUserId) return;
        setIsUpdating(true);
        const currentUserOverrides = chatConfig.userOverrides[selectedUserId] || {};
        const newOverrides = { ...currentUserOverrides, [key]: value };

        // Clean up override if it matches the global setting
        if (newOverrides[key] === chatConfig.global[key]) {
            delete newOverrides[key];
        }

        await chatService.updateChatSettingsForUser(selectedUserId, newOverrides);
        setChatConfig(prev => {
            if (!prev) return null;
            const updatedOverrides = { ...prev.userOverrides, [selectedUserId]: newOverrides };
            if (Object.keys(newOverrides).length === 0) {
                delete updatedOverrides[selectedUserId];
            }
            return { ...prev, userOverrides: updatedOverrides };
        });
        setIsUpdating(false);
    };

    const normalUsers = users.filter(u => u.role === USER_ROLES.USER);

    const getEffectiveSettingForUser = (key: keyof ChatSettings) => {
        if (!chatConfig || !selectedUserId) return false;
        return chatConfig.userOverrides[selectedUserId]?.[key] ?? chatConfig.global[key];
    };

    return (
        <div className="space-y-8">
            <section className="bg-white rounded-xl shadow-lg">
                <header className="p-6 border-b border-slate-200">
                    <h3 className="text-2xl font-semibold text-slate-700">تنظیمات عمومی چت</h3>
                    <p className="text-sm text-slate-500 mt-1">این تنظیمات برای تمام کاربران اعمال می‌شود مگر اینکه برای کاربر خاصی لغو شود.</p>
                </header>
                <div className="p-6 space-y-3">
                    {chatConfig ? (
                        <>
                            <ToggleSwitch label="فعال‌سازی ویرایش پیام" checked={chatConfig.global.allowEdit} onChange={(val) => handleGlobalSettingChange('allowEdit', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی حذف پیام" checked={chatConfig.global.allowDelete} onChange={(val) => handleGlobalSettingChange('allowDelete', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی فوروارد پیام" checked={chatConfig.global.allowForward} onChange={(val) => handleGlobalSettingChange('allowForward', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی ارسال فایل و عکس" checked={chatConfig.global.allowFileUpload} onChange={(val) => handleGlobalSettingChange('allowFileUpload', val)} disabled={isUpdating} />
                        </>
                    ) : <p>در حال بارگذاری تنظیمات...</p>}
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg">
                <header className="p-6 border-b border-slate-200">
                    <h3 className="text-2xl font-semibold text-slate-700">تنظیمات ویژه کاربر</h3>
                    <p className="text-sm text-slate-500 mt-1">یک کاربر را انتخاب کنید تا تنظیمات عمومی را برای او لغو (override) کنید.</p>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="user-override-select" className="block text-sm font-medium text-slate-700 mb-2">انتخاب کاربر:</label>
                        <select
                            id="user-override-select"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className={`${inputFieldClass} appearance-auto`}
                        >
                            <option value="">-- یک کاربر را انتخاب کنید --</option>
                            {normalUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.handle || user.username)} ({user.username})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedUserId && chatConfig && (
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                            <h4 className="font-semibold text-slate-600">دسترسی‌های کاربر انتخاب شده:</h4>
                            <p className="text-xs text-slate-500">تیک فعال به معنی override کردن تنظیم عمومی است. اگر تیک غیرفعال باشد، کاربر از تنظیم عمومی پیروی می‌کند.</p>
                            <ToggleSwitch label="فعال‌سازی ویرایش پیام" checked={getEffectiveSettingForUser('allowEdit')} onChange={(val) => handleUserOverrideChange('allowEdit', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی حذف پیام" checked={getEffectiveSettingForUser('allowDelete')} onChange={(val) => handleUserOverrideChange('allowDelete', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی فوروارد پیام" checked={getEffectiveSettingForUser('allowForward')} onChange={(val) => handleUserOverrideChange('allowForward', val)} disabled={isUpdating} />
                            <ToggleSwitch label="فعال‌سازی ارسال فایل و عکس" checked={getEffectiveSettingForUser('allowFileUpload')} onChange={(val) => handleUserOverrideChange('allowFileUpload', val)} disabled={isUpdating} />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ChatManagement;
