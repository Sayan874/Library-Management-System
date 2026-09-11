import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/authservice';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    BookOpen,
    Search,
    SendToBack,
    Download,
    LineChart,
    LogOut,
    Library,
    X
} from 'lucide-react';
import { SidebarSectionLabel, StatusBadge } from './ui-kit';

const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/members', icon: Users, label: 'Members' },
    { to: '/staff', icon: ShieldCheck, label: 'Issuers' },
    { to: '/library', icon: Library, label: 'Library Books' },
    { to: '/search', icon: Search, label: 'Search Books' },
    { to: '/borrow', icon: SendToBack, label: 'Issue Book' },
    { to: '/return', icon: Download, label: 'Return Book' },
    { to: '/reports', icon: LineChart, label: 'Reports' },
];

const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/members', icon: Users, label: 'Members' },
    { to: '/search', icon: Search, label: 'Search Books' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/borrow', icon: SendToBack, label: 'Issue Book' },
    { to: '/return', icon: Download, label: 'Return Book' },
];

export default function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const isAdmin = authService.isAdmin();
    const links = isAdmin ? adminLinks : userLinks;

    function handleLogout() {
        authService.logout();
        navigate('/login');
    }

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition md:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
            />
            <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-white/10 bg-slate-950/95 px-4 py-4 shadow-[0_24px_80px_-32px_rgba(15,23,42,1)] backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:px-5`}>
                <div className="mb-4 flex items-center justify-between md:hidden">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Navigation</p>
                    <button onClick={onClose} className="btn-ghost h-9 w-9 rounded-full px-0">
                        <X size={18} />
                    </button>
                </div>

                <div className="app-surface mb-4 flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <BookOpen size={16} />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-foreground">LibraryMS</span>
                    </div>
                    <StatusBadge tone={isAdmin ? 'primary' : 'info'}>
                        {isAdmin ? 'Admin' : 'User'}
                    </StatusBadge>
                </div>

                <div className="space-y-3">
                    <SidebarSectionLabel>Workspace</SidebarSectionLabel>
                    <nav className="flex flex-1 flex-col gap-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                                            : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                        }`
                                    }
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-inherit transition-colors group-hover:border-white/15">
                                        <Icon size={18} />
                                    </span>
                                    <span className="truncate">{link.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex h-11 w-full items-center gap-3 rounded-2xl border border-rose-400/15 bg-rose-400/8 px-4 text-sm font-medium text-rose-200 transition duration-200 hover:bg-rose-400/12"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
