import { useState } from 'react';
import { bookService } from '../services/Bookservice';
import { authService } from '../services/authservice';
import BookCard from '../components/Bookcard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Info, AlertCircle } from 'lucide-react';
import { EmptyState, PageHeader, SurfaceCard, Toast } from '../components/ui-kit';

export default function SearchBooks() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [searched, setSearched] = useState(false);
    const isAdmin = authService.isAdmin();

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setResults([]);
        try {
            const res = await bookService.searchGoogle(query.trim());
            setResults(res.data);
            setSearched(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to search Google Books. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddToLibrary(book) {
        try {
            await bookService.create({
                title: book.title,
                author: (book.authors && book.authors.length > 0) ? book.authors.join(', ') : (book.author || 'Unknown'),
                isbn: book.isbn13 || book.isbn10 || book.isbn || `GOOG-${Date.now()}`,
                thumbnail: book.thumbnail || book.cover_image || '',
                publisher: book.publisher || '',
                description: book.description || '',
                year: book.publishedDate ? parseInt(book.publishedDate.slice(0, 4), 10) || null : null,
            });
            showToast(`"${book.title}" added to your library.`);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to add book.');
        }
    }

    return (
        <div className="space-y-6">
            <Toast message={toast} type="success" />

            <PageHeader
                icon={Search}
                eyebrow="Discovery"
                title="Search Books"
                description="Search global book sources in a cleaner discovery workspace and optionally import titles into your local catalog."
            />

            <SurfaceCard className="p-5 sm:p-6">
                <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            className="input-base h-12"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="Enter a title, author, or exact ISBN..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" disabled={loading || !query.trim()} className="btn-primary h-12 px-6">
                        {loading ? 'Searching...' : 'Search Catalog'}
                    </button>
                </form>

                {!isAdmin ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0 text-primary" />You are viewing in read-only mode. Administrator permissions are required to import books into the local library.</p>
                    </div>
                ) : null}
            </SurfaceCard>

            {error ? (
                <div className="app-surface flex items-start gap-3 border-rose-400/20 bg-rose-400/8 p-4 text-rose-200">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            ) : null}

            {loading ? <LoadingSpinner text={`Searching global databases for "${query}"...`} /> : null}

            {!loading && !searched ? (
                <EmptyState
                    icon={Search}
                    title="Start with a search query"
                    description="Use the search bar above to discover external book metadata and bring better records into your library workflow."
                    className="app-surface"
                />
            ) : null}

            {!loading && searched && results.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No matches found"
                    description={`No results were returned for "${query}". Try broader keywords or search by a more exact title or ISBN.`}
                    className="app-surface"
                />
            ) : null}

            {results.length > 0 ? (
                <div className="space-y-4">
                    <SurfaceCard className="p-4">
                        <p className="text-sm text-muted-foreground">Retrieved <span className="font-semibold text-foreground">{results.length}</span> matching titles from the external source.</p>
                    </SurfaceCard>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {results.map((book, idx) => (
                            <BookCard key={idx} book={book} isAdmin={isAdmin} onAddToLibrary={isAdmin ? handleAddToLibrary : null} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
