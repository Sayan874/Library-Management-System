import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authservice';
import { BookOpen, Eye, EyeOff, LogIn, ShieldCheck, User, AlertCircle } from 'lucide-react';

// Credentials store — change these as needed
const CREDENTIALS = {
    admin: { id: 'admin', password: 'admin123', role: 'admin' },
    user: { id: 'user', password: 'user123', role: 'user' },
};

export default function Login() {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate credentials
        const matched = Object.values(CREDENTIALS).find(
            (c) => c.id === loginId.trim() && c.password === password
        );

        setTimeout(() => {
            if (matched) {
                authService.login(matched.role);
                navigate('/dashboard');
            } else {
                setError('Invalid Login ID or Password. Please try again.');
                setLoading(false);
            }
        }, 600);
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/12 via-background to-background pointer-events-none" />
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Logo + Title */}
                <div className="flex flex-col items-center text-center space-y-4 mb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
                        <BookOpen size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">LibraryMS</h1>
                        <p className="text-muted-foreground text-sm">Sign in to access the management portal</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome Back</h2>
                        <p className="text-sm text-muted-foreground">Enter your credentials to continue.</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-300">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Login ID */}
                        <div className="space-y-2">
                            <label htmlFor="loginId" className="text-sm font-medium text-foreground">
                                Login ID
                            </label>
                            <input
                                id="loginId"
                                type="text"
                                autoComplete="username"
                                required
                                placeholder="Enter your login ID"
                                className="input-base"
                                value={loginId}
                                onChange={(e) => { setLoginId(e.target.value); setError(''); }}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    placeholder="Enter your password"
                                    className="input-base pr-11"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPass ? 'Hide password' : 'Show password'}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-11 text-sm font-semibold"
                        >
                            {loading ? (
                                <span className="animate-pulse">Signing in...</span>
                            ) : (
                                <>
                                    <LogIn size={17} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Demo Credentials</span>
                        </div>
                    </div>

                    {/* Credentials hint cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: ShieldCheck, role: 'Admin', id: 'admin', pass: 'admin123', tone: 'text-primary' },
                            { icon: User, role: 'User', id: 'user', pass: 'user123', tone: 'text-sky-400' },
                        ].map(({ icon: Icon, role, id, pass, tone }) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => { setLoginId(id); setPassword(pass); setError(''); }}
                                className="group text-left bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-border rounded-xl p-3.5 transition-all duration-200 cursor-pointer"
                            >
                                <div className={`flex items-center gap-2 mb-2 ${tone}`}>
                                    <Icon size={14} />
                                    <span className="text-xs font-semibold uppercase tracking-wide">{role}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono">ID: <span className="text-foreground">{id}</span></p>
                                <p className="text-[11px] text-muted-foreground font-mono">PW: <span className="text-foreground">{pass}</span></p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5 group-hover:text-muted-foreground transition-colors">Click to autofill →</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
