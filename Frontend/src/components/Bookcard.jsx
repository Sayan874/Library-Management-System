import { Book, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { StatusBadge } from './ui-kit';

export default function BookCard({ book, onAddToLibrary, onEdit, onDelete, isAdmin }) {
    const isAvailable = book.status === 'Available';

    return (
        <div className="group app-surface relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:border-primary/25">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/14 via-sky-400/8 to-transparent" />
            <div className="relative h-52 w-full overflow-hidden border-b border-white/8 bg-slate-950/40">
                {(book.cover_image || book.thumbnail) ? (
                    <img
                        src={book.cover_image || book.thumbnail}
                        alt={book.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/20">
                        <Book size={64} strokeWidth={1} />
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <StatusBadge tone={isAvailable ? 'success' : 'danger'}>
                        {book.status || 'Available'}
                    </StatusBadge>
                </div>
            </div>

            <div className="relative flex flex-1 flex-col p-5">
                <div className="mb-4 flex-1">
                    <h3 className="mb-1.5 line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-foreground" title={book.title}>
                        {book.title}
                    </h3>
                    <p className="mb-4 text-sm leading-6 text-muted-foreground">
                        by {(book.authors && book.authors.length > 0) ? book.authors.join(', ') : (book.author || 'Unknown')}
                    </p>

                    <div className="space-y-2">
                        {(book.isbn || book.isbn13 || book.isbn10) && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>ISBN:</span> <span className="font-medium">{book.isbn || book.isbn13 || book.isbn10}</span>
                            </p>
                        )}
                        {book.genre && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>Genre:</span> <span className="font-medium">{book.genre}</span>
                            </p>
                        )}
                        {book.year && (
                            <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground/80">
                                <span>Year:</span> <span className="font-medium">{book.year}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between border-t border-white/8 pt-4">
                        <span className="text-xs font-medium text-muted-foreground">
                            Copy
                        </span>
                        {book.book_id && (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
                                #{book.book_id}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {onAddToLibrary && (
                            <button
                                className="btn-primary w-full"
                                onClick={() => onAddToLibrary(book)}
                            >
                                <PlusCircle size={16} />
                                <span>Add</span>
                            </button>
                        )}
                        {isAdmin && onEdit && (
                            <button
                                className="btn-secondary flex-1"
                                onClick={() => onEdit(book)}
                            >
                                <Edit2 size={14} />
                                <span>Edit</span>
                            </button>
                        )}
                        {isAdmin && onDelete && (
                            <button
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-400/8 px-3 text-sm font-medium text-rose-200 transition duration-200 hover:bg-rose-400/12"
                                onClick={() => onDelete(book)}
                                title="Delete Book"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
