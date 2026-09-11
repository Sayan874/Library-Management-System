import { useState, useEffect, useCallback } from 'react';
import { bookService } from '../services/Bookservice';
import { authService } from '../services/authservice';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/searchbar';
import {
    LibraryBig, Plus, Search, AlertCircle, Loader2, Save,
    CheckCircle2, BookOpen, Book, Edit2, Trash2, Minus
} from 'lucide-react';
import { EmptyState, Modal, PageHeader, SurfaceCard, StatusBadge, Toast } from '../components/ui-kit';

const EMPTY_FORM = { title: '', author: '', isbn: '', copies: 1, thumbnail: '', genre: '', publisher: '', year: '' };

/** Group per-copy book documents by ISBN (fall back to title) */
function groupBooks(books) {
    const map = new Map();
    for (const b of books) {
        const key = b.isbn || b.title || b.book_id;
        if (!map.has(key)) {
            map.set(key, { ...b, available: 0, total: 0, copies: [], availableCopyIds: [] });
        }
        const group = map.get(key);
        group.total += 1;
        if (b.status === 'Available') { group.available += 1; group.availableCopyIds.push(b.book_id); }
        group.copies.push(b.book_id);
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}

/** Single grouped book card */
function GroupedBookCard({ group, isAdmin, onEdit, onDelete, onAddCopy, onRemoveCopy }) {
    return (
        <div className="group app-surface relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:border-primary/25">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/14 via-sky-400/8 to-transparent" />
            {/* Cover */}
            <div className="relative h-52 w-full overflow-hidden border-b border-white/8 bg-slate-950/40">
                {group.cover_image ? (
                    <img src={group.cover_image} alt={group.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/20">
                        <Book size={64} strokeWidth={1} />
                    </div>
                )}
                {/* Copy count badge */}
                <div className="absolute top-3 left-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${group.available > 0
                        ? 'border-emerald-400/25 bg-emerald-400/15 text-emerald-300'
                        : 'border-rose-400/25 bg-rose-400/15 text-rose-300'
                        }`}>
                        {group.available}/{group.total} copies
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="relative flex flex-1 flex-col p-5">
                <div className="mb-4 flex-1">
                    <h3 className="mb-1.5 line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-foreground" title={group.title}>
                        {group.title}
                    </h3>
                    <p className="mb-4 text-sm leading-6 text-muted-foreground">by {group.author || 'Unknown'}</p>

                    <div className="space-y-2">
                        {group.isbn && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>ISBN:</span> <span className="font-medium">{group.isbn}</span>
                            </p>
                        )}
                        {group.genre && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>Genre:</span> <span className="font-medium">{group.genre}</span>
                            </p>
                        )}
                        {group.publisher && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>Publisher:</span> <span className="font-medium">{group.publisher}</span>
                            </p>
                        )}
                    </div>

                    {/* Copy Availability */}
                    <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Copies Available</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${group.available > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {group.available} / {group.total}
                                </span>
                                {isAdmin && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveCopy && onRemoveCopy(group)}
                                            disabled={group.available === 0}
                                            title="Remove one available copy"
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Minus size={10} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAddCopy && onAddCopy(group)}
                                            title="Add one more copy"
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                                        >
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${group.available > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                style={{ width: `${group.total > 0 ? (group.available / group.total) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                            {group.total - group.available} cop{(group.total - group.available) === 1 ? 'y' : 'ies'} issued
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="mt-auto flex gap-2 border-t border-white/8 pt-4">
                        {onEdit && (
                            <button className="btn-secondary flex-1" onClick={() => onEdit(group)}>
                                <Edit2 size={14} /> Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-400/8 px-3 text-sm font-medium text-rose-200 transition duration-200 hover:bg-rose-400/12"
                                onClick={() => onDelete(group)}
                                title="Delete all copies"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LibraryBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('available');
    const [showModal, setShowModal] = useState(false);
    const [editBook, setEditBook] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [isbnLoading, setIsbnLoading] = useState(false);
    const isAdmin = authService.isAdmin();

    const loadBooks = useCallback(async (q = '') => {
        try {
            setLoading(true);
            const res = await bookService.getAll({ search: q });
            setBooks(res.data);
        } catch {
            setError('Failed to load books.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadBooks(); }, [loadBooks]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const allGroups = groupBooks(books);
    const availGroups = allGroups.filter((g) => g.available > 0);
    const issuedGroups = allGroups.filter((g) => g.available < g.total); // groups with at least 1 issued copy
    const displayGroups = tab === 'available' ? availGroups : issuedGroups;

    function openAdd() { setEditBook(null); setForm(EMPTY_FORM); setShowModal(true); }

    function openEdit(group) {
        setEditBook(group);
        setForm({ title: group.title, author: group.author, isbn: group.isbn, copies: 1, thumbnail: group.cover_image || '', genre: group.genre || '', publisher: group.publisher || '', year: group.year || '' });
        setShowModal(true);
    }

    function closeModal() { setShowModal(false); setEditBook(null); }

    async function autofillIsbn() {
        if (!form.isbn) return;
        setIsbnLoading(true);
        try {
            const res = await bookService.autofillIsbn(form.isbn);
            const d = res.data;
            const thumb = (d.thumbnail || '').replace(/^http:\/\//, 'https://');
            setForm((f) => ({
                ...f,
                title: d.title || f.title,
                author: (d.authors && d.authors.length > 0) ? d.authors.join(', ') : (d.author || f.author),
                thumbnail: thumb || f.thumbnail,
                genre: d.genre || f.genre,
                publisher: d.publisher || f.publisher,
                year: d.year || f.year,
            }));
            showToast('Book details filled from Google Books.');
        } catch {
            showToast('ISBN not found on Google Books.');
        } finally {
            setIsbnLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, copies: Number(form.copies), year: form.year ? Number(form.year) : undefined, thumbnail: form.thumbnail || '' };
            if (editBook) {
                // Update all copies that share this ISBN/title
                await Promise.all(editBook.copies.map((id) => bookService.update(id, payload)));
                showToast('Book updated successfully.');
            } else {
                await bookService.create(payload);
                showToast('Book added successfully.');
            }
            closeModal();
            loadBooks(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to save book.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(group) {
        if (!confirm(`Delete all ${group.total} cop${group.total === 1 ? 'y' : 'ies'} of "${group.title}"?`)) return;
        try {
            for (const id of group.copies) {
                await bookService.remove(id).catch(() => { }); // skip issued copies gracefully
            }
            showToast('Book deleted.');
            loadBooks(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to delete book.');
        }
    }

    async function handleAddCopy(group) {
        try {
            await bookService.create({
                title: group.title, author: group.author, isbn: group.isbn || '',
                copies: 1, thumbnail: group.cover_image || '',
                genre: group.genre || '', publisher: group.publisher || '',
                year: group.year || undefined,
            });
            showToast('One copy added.');
            loadBooks(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to add copy.');
        }
    }

    async function handleRemoveCopy(group) {
        const copyId = group.availableCopyIds?.[0];
        if (!copyId) return;
        try {
            await bookService.remove(copyId);
            showToast('One copy removed.');
            loadBooks(search);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to remove copy.');
        }
    }

    return (
        <div className="space-y-6">
            <Toast message={toast} type="success" />

            <PageHeader
                icon={LibraryBig}
                eyebrow="Catalog"
                title="Library Books"
                description="Browse your collection by title. Each card shows available vs total copy count."
                action={<button onClick={openAdd} className="btn-primary"><Plus size={18} />Add Book</button>}
            />

            {error ? (
                <div className="app-surface flex items-start gap-3 border-rose-400/20 bg-rose-400/8 p-4 text-rose-200">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            ) : null}

            {/* Tabs + Search */}
            <SurfaceCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
                        <button
                            onClick={() => setTab('available')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${tab === 'available' ? 'bg-emerald-500/15 text-emerald-300' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <CheckCircle2 size={14} />
                            Available
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tab === 'available' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-muted-foreground'}`}>
                                {availGroups.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setTab('issued')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${tab === 'issued' ? 'bg-amber-500/15 text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <BookOpen size={14} />
                            Issued
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tab === 'issued' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/[0.06] text-muted-foreground'}`}>
                                {issuedGroups.length}
                            </span>
                        </button>
                    </div>
                    <div className="w-full max-w-md">
                        <SearchBar placeholder="Search by title, author, ISBN..." onSearch={(q) => { setSearch(q); loadBooks(q); }} />
                    </div>
                </div>
            </SurfaceCard>

            {loading ? <LoadingSpinner text="Fetching books..." /> : (
                displayGroups.length === 0 ? (
                    <EmptyState
                        icon={tab === 'available' ? CheckCircle2 : BookOpen}
                        title={tab === 'available' ? 'No available books' : 'No issued books'}
                        description={tab === 'available' ? 'All copies are currently issued, or add a new book.' : 'No copies are currently checked out.'}
                        className="app-surface"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {displayGroups.map((group) => (
                            <GroupedBookCard
                                key={group.isbn || group.title}
                                group={group}
                                isAdmin={isAdmin}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onAddCopy={handleAddCopy}
                                onRemoveCopy={handleRemoveCopy}
                            />
                        ))}
                    </div>
                )
            )}

            {/* Add / Edit Modal */}
            <Modal open={showModal} onClose={closeModal} title={editBook ? 'Edit Book Details' : 'Add New Book'} description="Fill in the details or use ISBN Autofill to pull from Google Books.">
                <form onSubmit={handleSave} className="space-y-6 p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">ISBN</label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                className={`input-base${editBook ? ' cursor-not-allowed bg-white/[0.03] opacity-70' : ''}`}
                                value={form.isbn}
                                onChange={editBook ? undefined : (e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                                readOnly={!!editBook}
                                tabIndex={editBook ? -1 : undefined}
                                placeholder="9780747532699"
                            />
                            {!editBook && (
                                <button type="button" onClick={autofillIsbn} disabled={isbnLoading} className="btn-secondary sm:w-auto">
                                    {isbnLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    Autofill
                                </button>
                            )}
                        </div>
                        {form.thumbnail && (
                            <div className="mt-2 flex items-center gap-3">
                                <img src={form.thumbnail} alt="cover preview" className="h-16 w-11 rounded object-cover ring-1 ring-white/10" />
                                <p className="text-xs text-emerald-400">✓ Cover image found</p>
                            </div>
                        )}
                    </div>

                    {[{ label: 'Title', key: 'title' }, { label: 'Author', key: 'author' }].map((f) => (
                        <div key={f.key} className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{f.label}</label>
                            <input
                                className="input-base cursor-not-allowed bg-white/[0.03] opacity-70"
                                value={form[f.key]}
                                readOnly
                                tabIndex={-1}
                                placeholder={`Auto-filled from ISBN`}
                            />
                        </div>
                    ))}

                    {!editBook && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Number of Copies *</label>
                            <input type="number" min={1} required className="input-base" value={form.copies} onChange={(e) => setForm((p) => ({ ...p, copies: e.target.value }))} />
                            <p className="text-xs text-muted-foreground">Each copy gets its own unique Book ID for circulation.</p>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
                        <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {editBook ? 'Save Changes' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
