/**
 * Program Detail page
 * - Fetches program detail from /api/clinical-programs?slug=...
 * - Renders Overview, Training Modules, Protocol Manuals, Documentation Forms, Additional Resources
 * - Uses shadcn Tabs for a clean tabbed interface
 */

import React from 'react';
import { useParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

/** A single training module item */
interface ModuleItem {
  /** Airtable record id */
  id: string;
  /** Module display name */
  name: string;
  /** Optional duration/length text */
  duration?: string;
  /** Optional description (not used yet) */
  description?: string;
  /** Link to module (direct link or file attachment URL) */
  url?: string;
}

/** A single manual item */
interface ManualItem {
  /** Airtable record id */
  id: string;
  /** Manual display name */
  name: string;
  /** File download URL */
  fileUrl?: string;
}

/** A single documentation form item */
interface FormItem {
  /** Airtable record id */
  id: string;
  /** Form display name */
  name: string;
  /** Category label */
  category?: string;
  /** File download URL */
  fileUrl?: string;
}

/** A single additional resource item */
interface ResourceItem {
  /** Airtable record id */
  id: string;
  /** Resource display name */
  name: string;
  /** Optional type (not used yet) */
  type?: string;
  /** Link URL */
  url?: string;
}

/** Data shape returned by /api/clinical-programs for a single slug */
interface ProgramDetailData {
  /** Program slug (path id) */
  slug: string;
  /** Program title from Airtable */
  title: string;
  /** Short subtitle/description */
  subtitle: string;
  /** Optional hero image (not wired yet) */
  image?: string;
  /** Overview paragraphs */
  overview: string[];
  /** Training modules list */
  modules: ModuleItem[];
  /** Protocol manuals list */
  manuals: ManualItem[];
  /** Documentation forms list */
  forms: FormItem[];
  /** Additional resources list */
  resources: ResourceItem[];
}

/**
 * Lightweight card link for files/links
 */
function LinkCard({
  title,
  subtitle,
  href,
}: {
  /** Primary text */
  title: string;
  /** Secondary text (small) */
  subtitle?: string;
  /** Link target */
  href?: string;
}) {
  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-slate-900 font-medium">{title}</div>
          {subtitle ? <div className="text-slate-500 text-sm">{subtitle}</div> : null}
        </div>
        <span className="text-primary group-hover:translate-x-0.5 transition-transform text-sm">
          Download →
        </span>
      </div>
    </a>
  );
}

/**
 * Main ProgramDetail page component
 */
export default function ProgramDetail(): JSX.Element {
  const { id: slug } = useParams() as { id: string };
  const [data, setData] = React.useState<ProgramDetailData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch program detail from serverless API
  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/clinical-programs?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load program (${res.status}): ${txt}`);
        }
        const json = (await res.json()) as ProgramDetailData;
        if (isMounted) setData(json);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load program');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-6 w-40 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="h-4 w-72 bg-slate-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-slate-200 rounded mb-8 animate-pulse" />
        <div className="h-8 w-56 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Program Error</h1>
        <p className="text-slate-600 mb-6">{error}</p>
        <a
          href="#/programs"
          className="inline-flex items-center rounded-md bg-primary text-white px-4 py-2 hover:opacity-95"
        >
          Back to Programs
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Program Not Found</h1>
        <p className="text-slate-600 mb-6">
          The program you're looking for doesn't exist or may have been moved.
        </p>
        <a
          href="#/programs"
          className="inline-flex items-center rounded-md bg-primary text-white px-4 py-2 hover:opacity-95"
        >
          Back to Programs
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">{data.title}</h1>
        {data.subtitle ? <p className="text-slate-600 mt-2">{data.subtitle}</p> : null}
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="manuals">Protocol Manuals</TabsTrigger>
          <TabsTrigger value="forms">Documentation Forms</TabsTrigger>
          <TabsTrigger value="resources">Additional Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <section className="prose max-w-none">
            {data.overview && data.overview.length > 0 ? (
              <div className="space-y-4">
                {data.overview.map((p, i) => (
                  <p key={i} className="text-slate-700 leading-7">
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Overview coming soon.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="modules">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.modules && data.modules.length > 0 ? (
              data.modules.map((m) => (
                <LinkCard
                  key={m.id}
                  title={m.name}
                  subtitle={m.duration}
                  href={m.url}
                />
              ))
            ) : (
              <p className="text-slate-600">No modules available.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="manuals">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.manuals && data.manuals.length > 0 ? (
              data.manuals.map((doc) => (
                <LinkCard key={doc.id} title={doc.name} href={doc.fileUrl} />
              ))
            ) : (
              <p className="text-slate-600">No manuals available.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="forms">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.forms && data.forms.length > 0 ? (
              data.forms.map((f) => (
                <LinkCard
                  key={f.id}
                  title={f.name}
                  subtitle={f.category}
                  href={f.fileUrl}
                />
              ))
            ) : (
              <p className="text-slate-600">No forms available.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="resources">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.resources && data.resources.length > 0 ? (
              data.resources.map((r) => (
                <LinkCard key={r.id} title={r.name} href={r.url} />
              ))
            ) : (
              <p className="text-slate-600">No additional resources available.</p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
