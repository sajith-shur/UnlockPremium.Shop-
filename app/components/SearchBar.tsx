'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCallback, useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ placeholder = 'Search products…', className = '' }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuery = searchParams.get('q') ?? '';

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      // Preserve category filter
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputRef.current?.value ?? '';
    updateSearch(value);
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    updateSearch('');
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search products"
      className={`relative ${className}`}
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <div className="relative flex items-center">
        <Search
          className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="product-search"
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-11 pr-10 py-3 rounded-xl glass-card text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          onChange={(e) => updateSearch(e.target.value)}
          aria-label="Search products"
        />
        {currentQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
