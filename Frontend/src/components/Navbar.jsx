import { useLocation } from 'react-router-dom';
import { authService } from '../services/authservice';
import {
    Menu,
    LayoutDashboard,
    Users,
    BookOpen,
    Search,
    SendToBack,
    Download,
    LineChart,
    Library
} from 'lucide-react';
import { MobileMenuButton, StatusBadge } from './ui-kit';

const pageTitles = {
    '/dashboard': { title: 'Dashboard', icon: LayoutDashboard },
    '/library': { title: 'Library Books', icon: Library },
    '/search': { title: 'Search Books', icon: Search },
    '/borrow': { title: 'Borrow Book', icon: SendToBack },
    '/return': { title: 'Return Book', icon: Download },
    '/reports': { title: 'Reports', icon: LineChart },
    '/members': { title: 'Members', icon: Users },
    '/staff': { title: 'Issuers', icon: Users },
};

export default function Navbar({ onOpenSidebar }) {
    const { pathname } = useLocation();
    const meta = pageTitles[pathname] || { title: 'Library MS', icon: BookOpen };
    const role = authService.getRole();
    const Icon = meta.icon;

    return (
        <header className="sticky top-0 z-40 px-4 pt-4 md:px-8 md:pt-5">
            <div className="app-surface flex min-h-16 items-center justify-between px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <MobileMenuButton onClick={onOpenSidebar} />
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                        <Icon size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{meta.title}</h1>
                        <p className="hidden text-xs text-muted-foreground sm:block">Library operations workspace</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right sm:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                        <p className="text-sm font-medium text-foreground">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold uppercase text-primary">
                            {role === 'admin' ? 'AD' : 'US'}
                        </div>
                        <div className="hidden sm:flex sm:flex-col">
                            <span className="text-sm font-semibold leading-none text-foreground">{role === 'admin' ? 'Admin' : 'User'}</span>
                            <span className="mt-1 text-xs text-muted-foreground">Authenticated session</span>
                        </div>
                        <StatusBadge tone={role === 'admin' ? 'primary' : 'info'} className="hidden lg:inline-flex">
                            {role === 'admin' ? 'Administrator' : 'Standard User'}
                        </StatusBadge>
                    </div>
                </div>
            </div>
        </header>
    );
}
