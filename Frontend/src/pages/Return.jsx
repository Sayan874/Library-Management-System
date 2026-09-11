import { useState, useEffect } from 'react';
import { issueService, staffService } from '../services/Bookservice';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, CheckCircle2, AlertCircle, RefreshCw, FileText, Calendar, IndianRupee, RotateCw, User } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard, Toast } from '../components/ui-kit';

export default function Return() {
    const [issueId, setIssueId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeIssues, setActiveIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(true);
    const [error, setError] = useState('');
    const [staff, setStaff] = useState([]);
    const [selectedIssuer, setSelectedIssuer] = useState('');
    const [reissuing, setReissuing] = useState(false);
    const [reissueMsg, setReissueMsg] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [issuesRes, staffRes] = await Promise.all([
                issueService.getAll(),
                staffService.getAll({ status: 'Active' })
            ]);
            const filtered = issuesRes.data.filter((i) => i.status === 'Issued');
            setActiveIssues(filtered);
            setStaff(staffRes.data);
        } catch {
            setError('Failed to load active issues or staff.');
        } finally {
            setLoadingIssues(false);
        }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const issuedOnTime = activeIssues.filter((i) => i.due_date >= todayStr);
    const overdueBooks = activeIssues.filter((i) => i.due_date < todayStr);

    async function handleReturn(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setReissueMsg('');
        try {
            const res = await issueService.returnBook(issueId.trim());
            setResult(res.data);
            setIssueId('');
            loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to return book.');
        } finally {
            setLoading(false);
        }
    }

    async function handleReissue() {
        setReissuing(true);
        setError('');
        try {
            const todayDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
            await issueService.issueBook({
                book_id: result.book_id,
                member_id: result.member_id,
                issuer_id: selectedIssuer,
            });
            setResult(null);
            setReissueMsg('Book reissued successfully to the same member.');
            setTimeout(() => setReissueMsg(''), 4000);
            loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reissue book.');
        } finally {
            setReissuing(false);
        }
    }

    if (loadingIssues) return <LoadingSpinner text="Loading return options..." />;

    return (
        <div className="space-y-6">
            <Toast message={reissueMsg} type="success" />

            <PageHeader
                icon={Download}
                eyebrow="Returns"
                title="Return Book"
                description="Process returns, surface overdue fines clearly, and optionally renew the same title from a refined circulation workflow."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SurfaceCard className="overflow-hidden">
                    <div className="border-b border-white/8 px-5 py-4">
                        <h2 className="section-title">Process Return</h2>
                        <p className="section-subtitle mt-1">Choose an active issue and complete the return protocol.</p>
                    </div>
                    <form onSubmit={handleReturn} className="space-y-5 p-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Select Active Issue *</label>
                            <select className="select-base" value={issueId} onChange={(e) => setIssueId(e.target.value)} required>
                                <option value="">Select an active issue</option>
                                {issuedOnTime.length > 0 ? (
                                    <optgroup label="Issued (On Time)">
                                        {issuedOnTime.map((i) => (
                                            <option key={i.issue_id} value={i.issue_id}>
                                                {i.book_name || '—'}  [{i.book_id}]  · Member {i.member_id}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : null}
                                {overdueBooks.length > 0 ? (
                                    <optgroup label="Overdue (Late)">
                                        {overdueBooks.map((i) => (
                                            <option key={i.issue_id} value={i.issue_id}>
                                                {i.book_name || '—'}  [{i.book_id}]  · Member {i.member_id}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : null}
                            </select>
                            <p className="text-xs text-muted-foreground">Choose either a normally issued book or an overdue book.</p>
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-200">
                                <p className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>
                            </div>
                        ) : null}

                        <button type="submit" disabled={loading || !issueId} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500">
                            {loading ? <RotateCw size={16} className="animate-spin" /> : <Download size={16} />}
                            {loading ? 'Processing...' : 'Mark as Returned'}
                        </button>
                    </form>
                </SurfaceCard>

                {result ? (
                    <SurfaceCard className={`overflow-hidden border ${result.fine > 0 ? 'border-amber-400/20' : 'border-emerald-400/20'}`}>
                        <div className={`border-b px-5 py-4 ${result.fine > 0 ? 'border-amber-400/15 bg-amber-400/10 text-amber-200' : 'border-emerald-400/15 bg-emerald-400/10 text-emerald-200'}`}>
                            <h2 className="text-lg font-semibold tracking-tight">{result.fine > 0 ? 'Returned with Fine' : 'Returned Successfully'}</h2>
                        </div>
                        <div className="space-y-6 p-5">
                            <div className="space-y-3">
                                {[
                                    { icon: FileText, label: 'Issue ID', value: result.issue_id, mono: true },
                                    { icon: FileText, label: 'Book Name', value: result.book_name || '—' },
                                    { icon: FileText, label: 'Book ID (Copy)', value: result.book_id, mono: true },
                                    { icon: User, label: 'Member ID', value: result.member_id, mono: true },
                                    { icon: Calendar, label: 'Issue Date', value: result.issue_date },
                                    { icon: Calendar, label: 'Due Date', value: result.due_date },
                                    { icon: CheckCircle2, label: 'Return Date', value: result.return_date },
                                ].map((row, i) => {
                                    const Icon = row.icon;
                                    return (
                                        <div key={i} className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={14} />{row.label}</div>
                                            <span className={`${row.mono ? 'font-mono text-xs uppercase tracking-[0.16em]' : 'text-sm'} font-medium text-foreground`}>{row.value}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`rounded-2xl border p-5 text-center ${result.fine > 0 ? 'border-amber-400/20 bg-amber-400/10' : 'border-emerald-400/20 bg-emerald-400/10'}`}>
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Fine Summary</p>
                                <div className={`mt-3 flex items-center justify-center text-4xl font-semibold tracking-tight ${result.fine > 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
                                    <IndianRupee size={28} />
                                    <span>{result.fine > 0 ? result.fine : '0'}</span>
                                </div>
                                <p className={`mt-2 text-sm ${result.fine > 0 ? 'text-amber-100/80' : 'text-emerald-100/80'}`}>{result.fine_message}</p>
                            </div>

                            <div className="space-y-3 border-t border-white/8 pt-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Renew this book</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Reissue the same title to the same member if needed.</p>
                                    </div>
                                    <StatusBadge tone="info">Optional</StatusBadge>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <select className="select-base" value={selectedIssuer} onChange={(e) => setSelectedIssuer(e.target.value)}>
                                        <option value="">Select staff</option>
                                        {staff.map((s) => <option key={s.staff_id} value={s.staff_id}>{s.name} ({s.role})</option>)}
                                    </select>
                                    <button className="btn-secondary" onClick={handleReissue} disabled={reissuing || !selectedIssuer}>
                                        {reissuing ? <RotateCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        Reissue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SurfaceCard>
                ) : (
                    <EmptyState icon={Download} title="No return processed yet" description="Select an active issue on the left to calculate fines and complete the return." className="app-surface" />
                )}
            </div>
        </div>
    );
}
