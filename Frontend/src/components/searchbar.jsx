import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = 'Search...', onSearch, debounceMs = 400 }) {
    const [value, setValue] = useState('');
    const onSearchRef = useRef(onSearch);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchRef.current(value.trim());
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [value, debounceMs]);

    return (
        <div className="relative flex w-full items-center">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground" />
            <input
                type="text"
                className="input-base"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}
