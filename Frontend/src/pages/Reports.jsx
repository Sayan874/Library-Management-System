import { useState, useEffect } from 'react';
import { issueService } from '../services/Bookservice';
import LoadingSpinner from '../components/LoadingSpinner';
import { ClipboardList, SendToBack, CheckCircle2, AlertCircle, IndianRupee, Filter } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../components/ui-kit';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Recharts tiny-font tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'hsl(226,24%,19%)', border: '1px solid hsl(224,16%,32%)', borderRadius: 10, padding: '8px 12px' }}>
            {label && <p style={{ fontSize: 11, color: 'hsl(215,20%,72%)', marginBottom: 4 }}>{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ fontSize: 11, fontWeight: 500, color: p.color }}>{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

const PIE_COLORS = ['hsl(247,72%,68%)', 'hsl(199,89%,48%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)'];

/* External arrow label — name + value outside the arc with a line */
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const r1 = outerRadius + 10;          // line start
    const r2 = outerRadius + 24;          // line end
    const rText = outerRadius + 28;       // text anchor
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const sx = cx + r1 * cos;
    const sy = cy + r1 * sin;
    const ex = cx + r2 * cos;
    const ey = cy + r2 * sin;
    const tx = cx + rText * cos;
    const ty = cy + rText * sin;
    const anchor = cos >= 0 ? 'start' : 'end';
    return (
        <g>
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="hsl(215,20%,55%)" strokeWidth={1} />
            <text x={tx} y={ty} textAnchor={anchor} dominantBaseline="central"
                style={{ fontSize: 10, fill: 'hsl(215,20%,80%)', fontFamily: 'inherit' }}>
                {name} <tspan fontWeight={600} fill="#fff">{value}</tspan>
            </text>
        </g>
    );
};

export default function Reports() {
    const [allIssues, setAllIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [error, setError] = useState('');

    useEffect(() => {
        issueService.getAll()
            .then((res) => setAllIssues(res.data))
            .catch(() => setError('Failed to load reports.'))
            .finally(() => setLoading(false));
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const overdue = allIssues.filter((i) => i.status === 'Issued' && i.due_date < today);
    const returned = allIssues.filter((i) => i.status === 'Returned');
    const active = allIssues.filter((i) => i.status === 'Issued');
    const totalFine = returned.reduce((sum, i) => sum + (i.fine || 0), 0);
    const filtered = filter === 'All' ? allIssues : filter === 'Issued' ? active : filter === 'Returned' ? returned : overdue;

    if (loading) return <LoadingSpinner text="Compiling reports analytics..." />;

    /* ── Pie chart data ── */
    const pieData = [
        { name: 'Active', value: active.length },
        { name: 'Returned', value: returned.length },
        { name: 'On Time', value: returned.filter(i => !i.fine || i.fine === 0).length },
        { name: 'Overdue', value: overdue.length },
    ].filter(d => d.value > 0);

    /* ── Bar chart — last 6 months bucketed ── */
    const monthBuckets = {};
    allIssues.forEach((issue) => {
        if (!issue.issue_date) return;
        const [y, m] = issue.issue_date.split('-');
        const key = `${y}-${m}`;
        if (!monthBuckets[key]) monthBuckets[key] = { month: key, Issued: 0, Returned: 0 };
        if (issue.status === 'Issued') monthBuckets[key].Issued += 1;
        if (issue.status === 'Returned') monthBuckets[key].Returned += 1;
    });
    const barData = Object.values(monthBuckets)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)
        .map(d => ({ ...d, month: d.month.slice(5) })); // show MM only

    const stats = [
        { label: 'Total Records', value: allIssues.length, icon: ClipboardList, tone: 'primary' },
        { label: 'Active Issues', value: active.length, icon: SendToBack, tone: 'info' },
        { label: 'Returned', value: returned.length, icon: CheckCircle2, tone: 'success' },
        { label: 'Overdue', value: overdue.length, icon: AlertCircle, tone: 'warning' },
        { label: 'Fines Collected', value: `₹${totalFine.toFixed(2)}`, icon: IndianRupee, tone: 'danger' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                icon={ClipboardList}
                eyebrow="Reports"
                title="Circulation Reports"
                description="Review the full lending history with analytics cards, charts, status filters, and a transaction ledger."
            />

            {error ? (
                <div className="app-surface flex items-start gap-3 border-rose-400/20 bg-rose-400/8 p-4 text-rose-200">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            ) : null}

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((s, idx) => {
                    const Icon = s.icon;
                    return (
                        <SurfaceCard key={idx} className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{s.value}</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-primary">
                                    <Icon size={20} />
                                </div>
                            </div>
                        </SurfaceCard>
                    );
                })}
            </div>

            {/* ── Charts row ── */}
            {allIssues.length > 0 && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                    {/* Bar chart */}
                    <SurfaceCard className="p-5">
                        <p className="text-sm font-semibold text-foreground">Monthly Circulation</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Issues vs returns over recent months</p>
                        <div className="mt-4">
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={barData} barCategoryGap="30%" barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,16%,32%)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10, fill: 'hsl(215,20%,72%)', fontFamily: 'inherit' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: 'hsl(215,20%,72%)', fontFamily: 'inherit' }}
                                        axisLine={false} tickLine={false} allowDecimals={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(232,20%,30%,0.4)' }} />
                                    <Bar dataKey="Issued" name="Issued" fill="hsl(247,72%,68%)" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Issued" position="top" style={{ fontSize: 10, fill: 'hsl(215,20%,80%)', fontFamily: 'inherit' }} formatter={(v) => v > 0 ? v : ''} />
                                    </Bar>
                                    <Bar dataKey="Returned" name="Returned" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Returned" position="top" style={{ fontSize: 10, fill: 'hsl(215,20%,80%)', fontFamily: 'inherit' }} formatter={(v) => v > 0 ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(247,72%,68%)' }} />Issued
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(142,71%,45%)' }} />Returned
                            </span>
                        </div>
                    </SurfaceCard>

                    {/* Pie / donut chart */}
                    <SurfaceCard className="p-5">
                        <p className="text-sm font-semibold text-foreground">Status Breakdown</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Distribution of all circulation records</p>
                        <div className="mt-2 flex flex-col items-center gap-4">
                            <ResponsiveContainer width="100%" height={230}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={68}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderPieLabel}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Custom legend — name + count, no overlap */}
                            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                                {pieData.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span style={{ fontSize: 11 }} className="text-muted-foreground">{entry.name}</span>
                                        <span style={{ fontSize: 11 }} className="font-semibold text-foreground">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SurfaceCard>
                </div>
            )}

            {/* ── Transaction log ── */}
            <SurfaceCard className="overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="section-title">Transaction Log</h2>
                        <p className="section-subtitle mt-1">Filter circulation history by lifecycle status.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Issued', 'Returned', 'Overdue'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={filter === f ? 'btn-primary h-10 px-4' : 'btn-secondary h-10 px-4'}
                            >
                                <Filter size={14} />
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="No matching records" description="No transactions match the selected report filter." />
                ) : (
                    <div className="table-wrap max-h-[480px] overflow-y-auto">
                        <table className="table-base">
                            <thead className="table-head">
                                <tr>
                                    <th>Issue ID</th>
                                    <th>Book</th>
                                    <th>Member</th>
                                    <th>Timeline</th>
                                    <th>Status</th>
                                    <th className="text-right">Fine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((issue) => {
                                    const isOverdue = issue.status === 'Issued' && issue.due_date < today;
                                    return (
                                        <tr key={issue.id} className="table-row">
                                            <td className="px-5 py-4 text-muted-foreground">{issue.issue_id.slice(-8)}</td>
                                            <td className="px-5 py-4">
                                                <div>
                                                    {issue.book_name ? <p className="max-w-[220px] truncate text-foreground">{issue.book_name}</p> : null}
                                                    <p className="mt-1 text-muted-foreground">{issue.book_id.slice(-8)}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{issue.member_id.slice(-8)}</td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1 text-muted-foreground">
                                                    <p><span className="text-foreground">{issue.issue_date}</span> issue</p>
                                                    <p><span className="text-foreground">{issue.due_date}</span> due</p>
                                                    {issue.return_date ? <p className="text-emerald-300"><span>{issue.return_date}</span> return</p> : null}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={isOverdue ? 'warning' : issue.status === 'Issued' ? 'info' : 'success'}>
                                                    {isOverdue ? 'Overdue' : issue.status}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {issue.fine > 0 ? <span className="text-rose-300">₹{issue.fine}</span> : <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SurfaceCard>
        </div>
    );
}
