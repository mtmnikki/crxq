/**
 * Resource Library page
 * - Fetches aggregated items from /api/resource-library
 * - Supports category tabs and a simple client-side search
 */

import React from 'react';

type Category = 'handouts' | 'clinical' | 'billing';
interface LibraryItem {
  /** Airtable record id */
  id: string;
  /** Display name */
  name: string;
  /** Category tag */
  category: Category;
  /** Link or file URL */
  url?: string;
}

interface ApiResponse {
  /** Flattened list of items from handouts, clinical guidelines, and billing resources */
  items: LibraryItem[];
}

/**
 * Small card component for a resource download
 */
function ResourceCard({ item }: { item: LibraryItem }) {
  return (
    <a
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-slate-900 font-medium">{item.name}</div>
          <div className="text-slate-500 text-sm capitalize">{item.category}</div>
        </div>
        <span className="text-primary group-hover:translate-x-0.5 transition-transform text-sm">
          Download →
        </span>
      </div>
    </a>
  );
}

/**
 * Resource Library page component
 */
export default function Resources(): JSX.Element {
  const [category, setCategory] = React.useState<'' | Category>('');
  const [q, setQ] = React.useState<string>('');
  const [items, setItems] = React.useState<LibraryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load library items from API
  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (category) params.set('cat', category);
        if (q.trim()) params.set('q', q.trim());
        const url = `/api/resource-library${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load resources (${res.status}): ${txt}`);
        }
        const json = (await res.json()) as ApiResponse;
        if (isMounted) setItems(json.items || []);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load resources');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [category, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">ClinicalRxQ Resource Library</h1>
        <p className="text-slate-600 mt-2">All resources pulled live from Airtable.</p>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 w-fit">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              category === '' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setCategory('handouts')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              category === 'handouts' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Patient Handouts
          </button>
          <button
            type="button"
            onClick={() => setCategory('clinical')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              category === 'clinical' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Clinical Resources
          </button>
          <button
            type="button"
            onClick={() => setCategory('billing')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              category === 'billing' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Medical Billing
          </button>
        </div>

        <div className="flex-1" />

        <div className="w-full md:w-80">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, category..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div>
          <div className="h-4 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-4">
          {error}
        </div>
      ) : (
        <>
          <div className="text-slate-600 mb-3">{items.length} result(s)</div>
          {items.length === 0 ? (
            <div className="text-slate-600">No resources found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
