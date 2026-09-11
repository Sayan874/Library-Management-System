import { useState, useEffect } from 'react';
import { issueService, bookService, memberService, staffService } from '../services/Bookservice';
import LoadingSpinner from '../components/LoadingSpinner';
import { SendToBack, Book, User, ShieldCheck, Calendar, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard, Toast } from '../components/ui-kit';

function calculateDueDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
    const nextDay = Math.min(day, daysInNextMonth);
    const resultDate = new Date(nextMonthYear, nextMonth, nextDay);
    return [resultDate.getFullYear(), String(resultDate.getMonth() + 1).padStart(2, '0'), String(resultDate.getDate()).padStart(2, '0')].join('-');
}

const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export default function Borrow() {
    const [form, setForm] = useState({ book_id: '', member_id: '', issuer_id: '', issue_date: todayStr, due_date: calculateDueDate(todayStr) });
    const [selectedIsbn, setSelectedIsbn] = useState(''); // step-1: chosen title/isbn group
    const [activeIssues, setActiveIssues] = useState([]);
    const [books, setBooks] = useState([]);
    const [members, setMembers] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState({ msg: '', type: 'success' });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
    };

    async function loadData() {
        try {
            const [issuesRes, booksRes, membersRes, staffRes] = await Promise.all([
                issueService.getAll({ status: 'Issued' }),
                bookService.getAll(),
                memberService.getAll({ status: 'Active' }),
                staffService.getAll({ status: 'Active' })
            ]);
            setActiveIssues(issuesRes.data);
            setBooks(booksRes.data.filter((b) => b.status === 'Available'));
            setMembers(membersRes.data);
            setStaffList(staffRes.data);
        } catch {
            showToast('Failed to load data.', 'danger');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await issueService.issueBook(form);
            showToast('Book issued successfully.');
            setForm({ book_id: '', member_id: '', issuer_id: '', issue_date: todayStr, due_date: calculateDueDate(todayStr) });
            setSelectedIsbn('');
            setModalOpen(false);
            loadData();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to issue book.', 'danger');
        } finally {
            setSubmitting(false);
        }
    }

    // Group available books by ISBN (fall back to title)
    const bookGroups = (() => {
        const map = new Map();
        for (const b of books) {
            const key = b.isbn || b.title || b.book_id;
            if (!map.has(key)) map.set(key, { title: b.title, author: b.author, isbn: b.isbn, copies: [] });
            map.get(key).copies.push(b);
        }
        return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
    })();

    // Copies belonging to the chosen title group
    const availableCopies = selectedIsbn
        ? (bookGroups.find((g) => (g.isbn || g.title) === selectedIsbn)?.copies ?? [])
        : [];

    if (loading) return <LoadingSpinner text="Loading borrow workflow..." />;

    const selectedGroup = bookGroups.find((g) => (g.isbn || g.title) === selectedIsbn);

    return (
        <div className="space-y-6">
            <Toast message={toast.msg} type={toast.type} />

            {/* Page Header with + button */}
            <PageHeader
                icon={SendToBack}
                eyebrow="Circulation"
                title="Issue Book"
                description="Live view of all currently borrowed items. Click + to issue a new book."
                action={
                    <button
                        onClick={() => setModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Issue Book
                    </button>
                }
            />

            {/* Full-width Active Borrows Table */}
            <SurfaceCard className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                    <div>
                        <h2 className="section-title">Current Active Borrows</h2>
                        <p className="section-subtitle mt-1">A live table of open circulation records.</p>
                    </div>
                    <StatusBadge tone="info">{activeIssues.length} active</StatusBadge>
                </div>

                {activeIssues.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="No books are currently issued" description="When books are borrowed, active circulation records will appear here." />
                ) : (
                    <div className="table-wrap">
                        <table className="table-base">
                            <thead className="table-head">
                                <tr>
                                    <th>Book / Copy ID</th>
                                    <th>Member</th>
                                    <th>Issuer</th>
                                    <th>Timeline</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeIssues.map((issue) => {
                                    const isOverdue = new Date(issue.due_date) < new Date();
                                    return (
                                        <tr key={issue.id} className="table-row">
                                            <td className="px-5 py-4">
                                                {issue.book_name && <p className="max-w-[180px] truncate text-sm font-medium text-foreground" title={issue.book_name}>{issue.book_name}</p>}
                                                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">#{issue.book_id}</p>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs uppercase text-muted-foreground">{issue.member_id}</td>
                                            <td className="px-5 py-4 font-mono text-xs uppercase text-muted-foreground">{issue.issuer_id}</td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-muted-foreground"><span className="font-medium text-foreground">{issue.issue_date}</span> issued</p>
                                                    <p className={isOverdue ? 'text-rose-300' : 'text-sky-300'}><span className="font-medium">{issue.due_date}</span> due</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={isOverdue ? 'danger' : 'info'}>{isOverdue ? 'Overdue' : 'Issued'}</StatusBadge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SurfaceCard>

            {/* Issue Book Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/95 shadow-[0_30px_100px_-30px_rgba(15,23,42,0.95)] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">Issue a Book</h2>
                                <p className="text-sm leading-6 text-muted-foreground">Select a title, then choose a specific copy to assign.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="btn-ghost h-9 w-9 rounded-full px-0">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="space-y-5 p-6">

                            {/* Step 1 — Book Title */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Book size={14} />Step 1 &mdash; Book Title *
                                </label>
                                <select
                                    className="select-base"
                                    value={selectedIsbn}
                                    onChange={(e) => { setSelectedIsbn(e.target.value); setForm((f) => ({ ...f, book_id: '' })); }}
                                >
                                    <option value="">-- Select a title --</option>
                                    {bookGroups.map((g) => {
                                        const key = g.isbn || g.title;
                                        return (
                                            <option key={key} value={key}>
                                                {g.title} ({g.copies.length} cop{g.copies.length === 1 ? 'y' : 'ies'} available)
                                            </option>
                                        );
                                    })}
                                </select>
                                {bookGroups.length === 0 && (
                                    <p className="text-xs font-medium text-amber-300">No books are currently available for issue.</p>
                                )}
                            </div>

                            {/* Step 2 — Copy ID (only shown after title chosen) */}
                            {selectedIsbn && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Book size={14} />Step 2 &mdash; Assign Copy ID *
                                    </label>
                                    <select
                                        className="select-base"
                                        required
                                        value={form.book_id}
                                        onChange={(e) => setForm((f) => ({ ...f, book_id: e.target.value }))}
                                    >
                                        <option value="">-- Select a copy --</option>
                                        {availableCopies.map((b) => (
                                            <option key={b.book_id} value={b.book_id}>
                                                Copy #{b.book_id}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedGroup && (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                            <p className="text-sm font-semibold text-foreground">{selectedGroup.title}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{selectedGroup.author || 'Unknown author'}</p>
                                            {selectedGroup.isbn && (
                                                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                                    ISBN: {selectedGroup.isbn}
                                                </p>
                                            )}
                                            {form.book_id && (
                                                <p className="mt-2 text-xs font-semibold text-emerald-400">
                                                    Issuing Copy: #{form.book_id}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground"><User size={14} />Member *</label>
                                    <select className="select-base" required value={form.member_id} onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))}>
                                        <option value="">Choose member</option>
                                        {members.map((m) => <option key={m.member_id} value={m.member_id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground"><ShieldCheck size={14} />Issuer *</label>
                                    <select className="select-base" required value={form.issuer_id} onChange={(e) => setForm((f) => ({ ...f, issuer_id: e.target.value }))}>
                                        <option value="">Choose issuer</option>
                                        {staffList.map((s) => <option key={s.staff_id} value={s.staff_id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground"><Calendar size={14} />Issue Date *</label>
                                    <input type="date" required className="input-base" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value, due_date: calculateDueDate(e.target.value) }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Due Date *</label>
                                    <input type="date" required readOnly className="input-base cursor-not-allowed bg-white/[0.03] text-muted-foreground" value={form.due_date} />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="btn-primary w-full">
                                {submitting ? <AlertCircle size={16} className="animate-spin" /> : <SendToBack size={16} />}
                                {submitting ? 'Issuing...' : 'Issue Book Now'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
