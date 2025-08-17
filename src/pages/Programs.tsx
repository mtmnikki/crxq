/**
 * Programs listing page (Airtable-free)
 * - Replaces Airtable-backed program list with local, static data to keep the UI working.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';

/** Program data from API */
interface ProgramData {
  slug: string;
  name: string;
  description: string;
}

export default function Programs() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/clinical-programs');
        if (!response.ok) {
          throw new Error(`Failed to fetch programs: ${response.status}`);
        }
        const data = await response.json();
        setPrograms(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load programs');
        console.error('Error fetching programs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Programs</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading programs...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading programs</div>
          <div className="text-gray-600">{error}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Card key={p.slug} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">{p.description}</p>
                <Link
                  to={`/program/${encodeURIComponent(p.slug)}`}
                  className="text-sm text-primary underline underline-offset-4"
                >
                  View details →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
