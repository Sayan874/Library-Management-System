import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/Bookservice';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/searchbar';
import { authService } from '../services/authservice';
import { Users, Plus, AlertCircle, Edit2, Trash2, Mail, Phone, Save, Loader2 } from 'lucide-react';
import { EmptyState, Modal, PageHeader, StatusBadge, SurfaceCard, Toast } from '../components/ui-kit';

const EMPTY_FORM = { name: '', email: '', phone: '+91', address: '' };

function getDigits(phone) {
    // Strip the +91 prefix and return only digits
    return (phone || '').replace(/^\+91/, '');
}

function handlePhoneDigits(digits, setter) {
    // Only allow digits, max 10
    const clean = digits.replace(/\D/g, '').slice(0, 10);
    setter((p) => ({ ...p, phone: '+91' + clean }));
}

export default function Members() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ msg: '', type: 'success' });

    const isAdmin = authService.isAdmin();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
    };

    const loadData = useCallback(async (q = '') => {
        try {
            setLoading(true);
            const res = await memberService.getAll({ search: q });
            setMembers(res.data);
        } catch {
            setError('Failed to load members.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    function openAdd() { setEditMode(null); setForm(EMPTY_FORM); setShowModal(true); }
    function openEdit(member) {
        setEditMode(member);
        // Ensure phone is stored with +91 prefix when editing
        const phone = member.phone?.startsWith('+91') ? member.phone : '+91' + (member.phone || '');
        setForm({ ...member, phone });
        setShowModal(true);
    }
    function closeModal() { setShowModal(false); }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            if (editMode) {
                await memberService.update(editMode.member_id, form);
                showToast('Member updated successfully.');
            } else {
                await memberService.create(form);
                showToast('Member added successfully.');
            }
            closeModal();
            loadData(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to save member.', 'danger');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(member) {
        if (!confirm(`Delete member "${member.name}"? This cannot be undone.`)) return;
        try {
            await memberService.remove(member.member_id);
            showToast('Member deleted successfully.');
            loadData(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to delete member.', 'danger');
        }
    }

    return (
        <div className="space-y-6">
            <Toast message={toast.msg} type={toast.type} />

            <PageHeader
                icon={Users}
                eyebrow="Members"
                title="Library Members"
                description="Maintain a clean member directory with clearer contact visibility, status cues, and a production-ready management experience."
                action={isAdmin ? <button onClick={openAdd} className="btn-primary"><Plus size={18} />Add Member</button> : null}
            />

            {error && (
                <div className="app-surface flex items-start gap-3 border-rose-400/20 bg-rose-400/8 p-4 text-rose-200">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            )}

            <SurfaceCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="section-title">Member Directory</h2>
                        <p className="section-subtitle mt-1">Search and review registered members across the organization.</p>
                    </div>
                    <div className="w-full max-w-md">
                        <SearchBar placeholder="Search by name, email, or phone..." onSearch={(q) => { setSearch(q); loadData(q); }} />
                    </div>
                </div>
            </SurfaceCard>

            {loading ? <LoadingSpinner text="Loading member directory..." /> : (
                <SurfaceCard className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                        <div>
                            <h2 className="section-title">All Members</h2>
                            <p className="section-subtitle mt-1">Every member record, status, and contact detail in one place.</p>
                        </div>
                        <StatusBadge tone="primary">{members.length} total</StatusBadge>
                    </div>

                    {members.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No members found"
                            description="Try a different search term or create a new member record if your directory is still empty."
                        />
                    ) : (
                        <div className="table-wrap">
                            <table className="table-base">
                                <thead className="table-head">
                                    <tr>
                                        <th>Member</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        {isAdmin ? <th className="text-right">Actions</th> : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m) => (
                                        <tr key={m.id} className="table-row">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold text-primary">
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{m.name}</p>
                                                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{m.member_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1.5 text-sm text-muted-foreground">
                                                    <p className="flex items-center gap-2"><Mail size={14} />{m.email}</p>
                                                    <p className="flex items-center gap-2"><Phone size={14} />{m.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={m.status === 'Active' ? 'success' : 'danger'}>{m.status}</StatusBadge>
                                            </td>
                                            {isAdmin ? (
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openEdit(m)} className="btn-secondary h-10 px-3"><Edit2 size={14} />Edit</button>
                                                        <button onClick={() => handleDelete(m)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/15 bg-rose-400/8 px-3 text-sm font-medium text-rose-200 transition duration-200 hover:bg-rose-400/12"><Trash2 size={14} />Delete</button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SurfaceCard>
            )}

            <Modal
                open={showModal}
                onClose={closeModal}
                title={editMode ? 'Edit Member Profile' : 'Register New Member'}
                description="Update member identity, communication details, and account status without changing any existing workflow."
            >
                <form onSubmit={handleSave} className="space-y-5 p-6">
                    {[
                        { label: 'Name *', key: 'name', type: 'text', placeholder: 'Please enter name' },
                        { label: 'Gmail *', key: 'email', type: 'email', placeholder: 'Please enter gmail' },
                    ].map((f) => (
                        <div key={f.key} className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{f.label}</label>
                            <input
                                type={f.type}
                                required
                                placeholder={f.placeholder}
                                className="input-base"
                                value={form[f.key]}
                                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                            />
                        </div>
                    ))}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone Number *</label>
                        <div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] focus-within:border-[hsl(var(--ring))] focus-within:shadow-[0_0_0_2px_hsl(var(--ring)/0.25)] transition-all duration-200">
                            <span className="select-none px-3 text-sm font-semibold text-muted-foreground border-r border-[hsl(var(--border))] h-11 flex items-center">+91</span>
                            <input
                                type="tel"
                                required
                                inputMode="numeric"
                                placeholder="Please enter phone number"
                                className="flex-1 bg-transparent px-3 text-sm text-foreground outline-none h-11"
                                value={getDigits(form.phone)}
                                onChange={(e) => handlePhoneDigits(e.target.value, setForm)}
                                pattern="[0-9]{10}"
                                title="Enter exactly 10 digits"
                                maxLength={10}
                            />
                            <span className="pr-3 text-xs text-muted-foreground/60">{getDigits(form.phone).length}/10</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Home Address</label>
                        <textarea
                            className="textarea-base min-h-24 resize-none"
                            placeholder="Enter physical address..."
                            value={form.address || ''}
                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        />
                    </div>

                    {editMode ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Account Status *</label>
                            <select className="select-base" value={form.status || 'Active'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    ) : null}

                    <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
                        <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {editMode ? 'Save Changes' : 'Register Member'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
