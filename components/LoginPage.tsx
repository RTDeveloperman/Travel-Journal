
import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (username: string, password_placeholder: string) => Promise<User | null>; // Password handling is complex and backend-dependent
  onSwitchToSignup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignup, setLoading, setError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Placeholder for password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username) {
      setError("نام کاربری الزامی است.");
      return;
    }
    // Basic password validation placeholder - real validation is more complex
    // if (!password) {
    //     setError("رمز عبور الزامی است.");
    //     return;
    // }
    setLoading(true);
    try {
      const user = await onLogin(username, password);
      if (!user) {
        setError("نام کاربری یا رمز عبور نامعتبر است.");
      }
      // Successful login will be handled by App.tsx setting currentUser
    } catch (err: any) {
      setError(err.message || "خطا در ورود. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-fixed bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080?travel,adventure,world,map')" }}>
      <div className="bg-white bg-opacity-90 p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md m-4">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">ورود به دفترچه خاطرات</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1 text-right">
              نام کاربری
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 text-right"
              placeholder="مثال: admin یا user1"
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1 text-right">
              رمز عبور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 text-right"
              placeholder="رمز عبور خود را وارد کنید"
            // required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-sky-500 rounded-lg shadow-xl hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          >
            ورود
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-200 pt-4">
          <p className="text-slate-600 mb-2">حساب کاربری ندارید؟</p>
          <button
            onClick={onSwitchToSignup}
            className="text-sky-600 hover:text-sky-800 font-semibold hover:underline focus:outline-none"
          >
            ثبت نام کنید
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-6 text-center">
          نام‌های کاربری نمونه برای تست: <code className="bg-slate-200 px-1 rounded">admin</code> یا <code className="bg-slate-200 px-1 rounded">user1</code>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
