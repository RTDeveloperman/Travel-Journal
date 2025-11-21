import React, { useState } from 'react';

interface SignupPageProps {
    onRegister: (userData: any) => Promise<void>;
    onSwitchToLogin: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onRegister, onSwitchToLogin, setLoading, setError }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        bio: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.username || !formData.username.trim()) {
            setError("نام کاربری الزامی است.");
            return;
        }
        if (!formData.password) {
            setError("رمز عبور الزامی است.");
            return;
        }

        setLoading(true);
        try {
            await onRegister(formData);
        } catch (err: any) {
            setError(err.message || "خطا در ثبت نام.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-fixed bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080?travel,adventure,world,map')" }}>
            <div className="bg-white bg-opacity-90 p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md m-4">
                <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">ثبت نام در دفترچه خاطرات</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1 text-right">نام کاربری *</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-right"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1 text-right">رمز عبور *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-right"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1 text-right">نام</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-right"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1 text-right">نام خانوادگی</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-right"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1 text-right">بیوگرافی کوتاه</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-right"
                            rows={3}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-lg shadow-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mt-4"
                    >
                        ثبت نام
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-slate-200 pt-4">
                    <p className="text-slate-600 mb-2">حساب کاربری دارید؟</p>
                    <button
                        onClick={onSwitchToLogin}
                        className="text-sky-600 hover:text-sky-800 font-semibold hover:underline focus:outline-none"
                    >
                        ورود به سیستم
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
