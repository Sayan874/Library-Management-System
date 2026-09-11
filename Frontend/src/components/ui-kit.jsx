import { X, PanelLeftClose, AlertCircle, CheckCircle2, Inbox, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function PageHeader({ icon: Icon, title, action }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
                {Icon ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-primary">
                        <Icon size={16} />
                    </div>
                ) : null}
                <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
            </div>
            {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </div>
    );
}

export function SurfaceCard({ className, children }) {
    return <div className={cn('app-surface', className)}>{children}</div>;
}

export function SectionHeader({ title, subtitle, action, className }) {
    return (
        <div className={cn('flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div>
                <h2 className="section-title">{title}</h2>
                {subtitle ? <p className="section-subtitle mt-1">{subtitle}</p> : null}
            </div>
            {action}
        </div>
    );
}

export function StatusBadge({ tone = 'default', children, className }) {
    const tones = {
        default: 'status-badge border-white/10 bg-white/[0.05] text-foreground',
        primary: 'status-badge border-primary/20 bg-primary/10 text-primary',
        success: 'status-badge border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        warning: 'status-badge border-amber-400/20 bg-amber-400/10 text-amber-300',
        danger: 'status-badge border-rose-400/20 bg-rose-400/10 text-rose-300',
        info: 'status-badge border-sky-400/20 bg-sky-400/10 text-sky-300',
    };

    return <span className={cn(tones[tone] || tones.default, className)}>{children}</span>;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
    return (
        <div className={cn('flex min-h-[260px] flex-col items-center justify-center gap-4 px-6 py-14 text-center text-muted-foreground', className)}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-primary/70">
                <Icon size={30} />
            </div>
            <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">{title}</p>
                {description ? <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
            </div>
            {action}
        </div>
    );
}

export function Toast({ message, type = 'success' }) {
    if (!message) return null;

    const config = {
        success: {
            icon: CheckCircle2,
            className: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200',
        },
        danger: {
            icon: AlertCircle,
            className: 'border-rose-400/20 bg-rose-400/12 text-rose-200',
        },
        info: {
            icon: Info,
            className: 'border-sky-400/20 bg-sky-400/12 text-sky-200',
        },
    }[type] || {
        icon: Info,
        className: 'border-white/10 bg-white/[0.08] text-foreground',
    };

    const Icon = config.icon;

    return (
        <div className={cn('fixed right-4 top-20 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-300 sm:right-6', config.className)}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="text-sm font-medium leading-6">{message}</span>
        </div>
    );
}

export function Modal({ open, title, description, onClose, children, className }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className={cn('w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/95 shadow-[0_30px_100px_-30px_rgba(15,23,42,0.95)] animate-in zoom-in-95 duration-200', className)} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
                        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
                    </div>
                    <button onClick={onClose} className="btn-ghost h-9 w-9 rounded-full px-0">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function SidebarSectionLabel({ children }) {
    return <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{children}</p>;
}

export function MobileMenuButton({ onClick }) {
    return (
        <button onClick={onClick} className="btn-secondary h-10 w-10 rounded-xl px-0 md:hidden" aria-label="Open navigation">
            <PanelLeftClose size={18} />
        </button>
    );
}
