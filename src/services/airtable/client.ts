/**
 * Airtable API client (browser) that talks to our Vercel Serverless endpoints.
 * - Keeps PAT secure by never calling Airtable directly from the browser.
 * - Provides typed helpers for Program Detail and Resource Library.
 */

export interface ProgramDetailData {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  overview: string[];
  modules: Array<{ id: string; name: string; duration?: string; description?: string; url?: string }>;
  manuals: Array<{ id: string; name: string; fileUrl?: string }>;
  forms: Array<{ id: string; name: string; category?: string; fileUrl?: string }>;
  resources: Array<{ id: string; name: string; type?: string; url?: string }>;
}

export interface ResourceLibraryItem {
  id: string;
  name: string;
  category: 'handouts' | 'clinical' | 'billing';
  url?: string;
}

async function getJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init });
  if (!res.ok) {
    // Throw including body for easier debugging
    let text = '';
    try {
      text = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch a single program detail by slug.
 */
export async function fetchProgramDetail(slug: string): Promise<ProgramDetailData> {
  return getJSON<ProgramDetailData>(`/api/clinical-programs?slug=${encodeURIComponent(slug)}`);
}

/**
 * Fetch unified Resource Library items (optionally filtered by category and query).
 */
export async function fetchResourceLibrary(params?: { cat?: 'handouts' | 'clinical' | 'billing'; q?: string }) {
  const usp = new URLSearchParams();
  if (params?.cat) usp.set('cat', params.cat);
  if (params?.q) usp.set('q', params.q);
  const qs = usp.toString();
  return getJSON<{ items: ResourceLibraryItem[] }>(`/api/resource-library${qs ? `?${qs}` : ''}`);
}
