import { useState, useEffect } from 'react';
import { statsService, issueService, bookService, memberService } from '../services/Bookservice';
import LoadingSpinner from '../components/LoadingSpinner';
import { Library, Users, SendToBack, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../components/ui-kit';

const statCards = [
    { key: 'total_books', label: 'Total Books', icon: Library, color: 'text-indigo-300', bg: 'bg-indigo-400/12' },
    { key: 'total_members', label: 'Total Members', icon: Users, color: 'text-emerald-300', bg: 'bg-emerald-400/12' },
    { key: 'active_issues', label: 'Active Issues', icon: SendToBack, color: 'text-sky-300', bg: 'bg-sky-400/12' },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-400/12' },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentIssues, setRecentIssues] = useState([]);
    const [bookMap, setBookMap] = useState({});
    const [memberMap, setMemberMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [statsRes, issuesRes, booksRes, membersRes] = await Promise.all([
                    statsService.get(),
                    issueService.getAll(),
                    bookService.getAll(),
                    memberService.getAll(),
                ]);
                setStats(statsRes.data);
                setRecentIssues(issuesRes.data.slice(0, 10));
                // Build lookup maps: id -> name
                const bMap = {};
                booksRes.data.forEach((b) => { bMap[b.book_id] = b.title; });
                setBookMap(bMap);
                const mMap = {};
                membersRes.data.forEach((m) => { mMap[m.member_id] = m.name; });
                setMemberMap(mMap);
            } catch {
                setError('Could not connect to the backend. Make sure the server is running on port 8000.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />;

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Activity}
                eyebrow="Overview"
                title="Dashboard"
                description="Monitor collection health, member activity, and live circulation from one polished operations view."
            />

            {error && (
                <div className="app-surface flex items-start gap-3 border-rose-400/20 bg-rose-400/8 p-4 text-rose-200">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div className="metric-card" key={s.key}>
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-white/[0.06] to-transparent" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                                        {stats ? (stats[s.key] ?? '—') : '—'}
                                    </p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} ${s.color}`}>
                                    <Icon size={22} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <SurfaceCard className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="section-title">Recent Borrow Activity</h2>
                        <p className="section-subtitle mt-1">The latest circulation transactions across your library.</p>
                    </div>
                    <StatusBadge tone="info">{recentIssues.length} recent records</StatusBadge>
                </div>

                {recentIssues.length === 0 ? (
                    <EmptyState
                        icon={SendToBack}
                        title="No borrow records yet"
                        description="Once books start moving through the system, the latest issue activity will appear here."
                    />
                ) : (
                    <div className="table-wrap max-h-[480px] overflow-y-auto">
                        <table className="table-base w-full table-fixed">
                            <colgroup>
                                <col style={{ width: '90px' }} />
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '90px' }} />
                                <col style={{ width: '70px' }} />
                            </colgroup>
                            <thead className="table-head sticky top-0 z-10">
                                <tr>
                                    <th>Issue ID</th>
                                    <th>Book</th>
                                    <th>Member</th>
                                    <th>Issued On</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th className="text-right">Fine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentIssues.map((issue) => (
                                    <tr key={issue.id} className="table-row">
                                        <td className="px-3 py-3 font-mono text-xs uppercase text-muted-foreground">{issue.issue_id.slice(-8)}</td>
                                        <td className="px-3 py-3 font-medium text-foreground">
                                            <span className="block truncate" title={bookMap[issue.book_id] || issue.book_id}>
                                                {bookMap[issue.book_id] || issue.book_id.slice(-8)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-medium text-foreground">
                                            <span className="block truncate" title={memberMap[issue.member_id] || issue.member_id}>
                                                {memberMap[issue.member_id] || issue.member_id.slice(-8)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-sm font-medium text-foreground">{issue.issue_date}</td>
                                        <td className="px-3 py-3 text-sm text-muted-foreground">{issue.due_date}</td>
                                        <td className="px-3 py-3">
                                            <StatusBadge
                                                tone={
                                                    issue.status === 'Returned'
                                                        ? 'success'
                                                        : issue.status === 'Issued'
                                                            ? 'info'
                                                            : 'warning'
                                                }
                                            >
                                                {issue.status}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-3 py-3 text-right font-medium">
                                            {issue.fine > 0 ? <span className="text-rose-300">₹{issue.fine}</span> : <span className="text-muted-foreground/50">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SurfaceCard>


        </div>
    );
}
