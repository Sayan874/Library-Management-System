import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="app-surface-muted flex min-h-[38vh] flex-col items-center justify-center gap-5 p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_16px_40px_-24px_hsl(var(--ring)/0.9)]">
                <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-base font-semibold tracking-tight text-foreground">Preparing your workspace</p>
                <p className="text-sm font-medium text-muted-foreground">{text}</p>
            </div>
        </div>
    );
}
