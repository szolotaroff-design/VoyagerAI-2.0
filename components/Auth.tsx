import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for errors in the URL (e.g., from expired reset links)
    React.useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1)); // Remove #
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                setError(decodeURIComponent(errorDescription).replace(/\+/g, ' '));
                // Optional: clear hash to clean up URL
                // window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAppleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (showForgotPassword) {
            setLoading(true);
            setError(null);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setResetSent(true);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!showPasswordInput) {
            if (!email) {
                setError('Please enter your email address');
                return;
            }
            setShowPasswordInput(true);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setShowVerification(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            {/* Main Card */}
            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl p-8 border border-white/50 relative overflow-hidden">
                {/* Decorative blob inside card */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 mb-4">
                            <i className="fas fa-globe-americas text-3xl text-white"></i>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Voyager<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span></h1>
                        <p className="text-slate-500 font-medium">Your smart travel companion</p>
                    </div>

                    {showVerification ? (
                        <div className="p-7">
                            <div className="text-center py-4">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 animate-bounce">
                                    <i className="fas fa-envelope-open-text text-3xl"></i>
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-slate-800">Check your inbox</h2>
                                <p className="text-slate-500 mb-7">
                                    We sent a verification link to <span className="font-bold text-slate-700">{email}</span>.<br />
                                    Please click the link to verify your account.
                                </p>
                                <button
                                    onClick={() => { setShowVerification(false); setIsLogin(true); }}
                                    className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    ) : resetSent ? (
                        <div className="p-7 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <i className="fas fa-check-circle text-3xl"></i>
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-slate-800">Check your inbox</h2>
                            <p className="text-slate-500 mb-7">
                                We sent password recovery instructions to <span className="font-bold text-slate-700">{email}</span>.
                            </p>
                            <button
                                onClick={() => { setResetSent(false); setShowForgotPassword(false); setIsLogin(true); }}
                                className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : showForgotPassword ? (
                        <div className="animate-in fade-in slide-in-from-right duration-300">
                            <button
                                onClick={() => { setShowForgotPassword(false); setError(null); }}
                                className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors font-bold"
                            >
                                <i className="fas fa-arrow-left"></i> Back
                            </button>

                            <h2 className="mb-2 text-2xl font-bold text-slate-800">Reset Password</h2>
                            <p className="mb-7 text-sm text-slate-500">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleAuth} className="space-y-5">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-500 flex items-center gap-2">
                                        <i className="fas fa-exclamation-circle text-sm"></i>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <i className="fas fa-circle-notch animate-spin"></i> Sending...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8 flex gap-4 rounded-xl bg-slate-100 p-1">
                                <button
                                    onClick={() => { setIsLogin(true); setError(null); setShowPasswordInput(false); }}
                                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsLogin(false); setError(null); setShowPasswordInput(false); }}
                                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            <h2 className="mb-1 text-2xl font-bold text-slate-800">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="mb-7 text-sm text-slate-500">
                                {isLogin ? 'Enter your credentials to access your trips.' : 'Sign up to start planning your next adventure.'}
                            </p>

                            {/* Social Login Section (Top) */}
                            <div className="flex justify-center gap-5 mb-7">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:shadow-md hover:-translate-y-1 transition-all group"
                                    title="Continue with Google"
                                >
                                    <i className="fab fa-google text-2xl text-slate-600 group-hover:text-blue-600 transition-colors"></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAppleLogin}
                                    className="w-14 h-14 rounded-full bg-slate-900 border border-slate-900 shadow-sm flex items-center justify-center hover:shadow-md hover:-translate-y-1 transition-all group"
                                    title="Continue with Apple"
                                >
                                    <i className="fab fa-apple text-2xl text-white"></i>
                                </button>
                            </div>

                            <div className="relative mb-7">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                    <span className="bg-white px-3 text-slate-400 font-bold">Or continue with email</span>
                                </div>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-5">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <i className="fas fa-envelope text-slate-400"></i>
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                {showPasswordInput && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                                placeholder="••••••••"
                                                required={showPasswordInput}
                                            />
                                        </div>
                                        {isLogin && (
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowForgotPassword(true); setError(null); }}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    Forgot Password?
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="animate-pulse rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                                        <i className="fas fa-exclamation-circle mt-0.5"></i>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <i className="fas fa-circle-notch animate-spin"></i> {isLogin ? 'Signing in...' : 'Creating...'}
                                        </span>
                                    ) : (
                                        <>
                                            {!showPasswordInput ? 'Continue' : (isLogin ? 'Sign In' : 'Create Account')}
                                            {!loading && <i className="fas fa-arrow-right ml-2 opacity-50 group-hover:translate-x-1 transition-transform"></i>}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-xs text-slate-400">
                                    By continuing, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
