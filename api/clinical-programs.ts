import type { IncomingMessage, ServerResponse } from 'http';

// Use require to avoid type issues; airtable CJS is supported on Vercel Node runtime.
const Airtable = require('airtable');

/** Minimal attachment object from Airtable */
interface AirtableAttachment {
  url: string;
  filename?: string;
}

/**
 * Get first attachment URL if present.
 */
function firstAttachmentUrl(attachments: unknown): string | undefined {
  const list = (attachments as AirtableAttachment[]) || [];
  if (Array.isArray(list) && list.length > 0 && list[0]?.url) return list[0].url;
  return undefined;
}

/**
 * Helper: read query string safely from Node req
 */
function getQuery(req: any): Record<string, string | undefined> {
  const url = new URL(req.url || '', 'http://localhost');
  const params: Record<string, string | undefined> = {};
  url.searchParams.forEach((v, k) => (params[k] = v));
  return params;
}

/**
 * Escape a string for Airtable filterByFormula single-quoted literals.
 * Replaces single quotes with escaped version.
 */
function escapeFormulaString(value: string): string {
  return value.replace(/'/g, "''");
}

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  try {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Airtable is not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in your Vercel project.',
        })
      );
      return;
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const query = getQuery(req);
    const slug = (query.slug || '').trim();

    // If no slug, return a compact list of programs for listings
    if (!slug) {
      const records = await base('ClinicalPrograms')
        .select({
          fields: ['programName', 'programDescription', 'programSlug'],
          pageSize: 50,
        })
        .all();

      const list = records.map((r: any) => ({
        slug: (r.get('programSlug') as string) || '',
        name: (r.get('programName') as string) || '',
        description: (r.get('programDescription') as string) || '',
      }));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      // Public caching via Vercel Edge/CDN
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      res.end(JSON.stringify({ items: list }));
      return;
    }

    // Otherwise, return full detail for a single program by slug
    const esc = escapeFormulaString(slug);
    const progRecords = await base('ClinicalPrograms')
      .select({
        filterByFormula: `{programSlug} = '${esc}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (!progRecords || progRecords.length === 0) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Program not found' }));
      return;
    }

    const p = progRecords[0];
    const title = (p.get('programName') as string) || '';
    const subtitle = (p.get('programDescription') as string) || '';
    const overviewRaw = (p.get('programOverview') as string) || '';

    // Split overview into paragraphs by empty line or newline
    const overview: string[] = overviewRaw
      ? overviewRaw
          .split(/\n\s*\n|\r\n\r\n|\n/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Fetch related records by programSlug in child tables
    const [modules, manuals, forms, resources] = await Promise.all([
      base('TrainingModules')
        .select({
          filterByFormula: `'${esc}' IN {programSlug}`,
          fields: ['moduleName', 'moduleLength', 'moduleFile', 'moduleLink', 'sortOrder'],
          sort: [{ field: 'sortOrder', direction: 'asc' } as any],
          pageSize: 100,
        })
        .all(),
      base('ProtocolManuals')
        .select({
          filterByFormula: `'${esc}' IN {programSlug}`,
          fields: ['protocolName', 'protocolFile', 'fileLink'],
          pageSize: 100,
        })
        .all(),
      base('DocumentationForms')
        .select({
          filterByFormula: `'${esc}' IN {programSlug}`,
          fields: ['formName', 'formFile', 'formCategory', 'formLink'],
          pageSize: 200,
        })
        .all(),
      base('AdditionalResources')
        .select({
          filterByFormula: `'${esc}' IN {programSlug}`,
          fields: ['resourceName', 'resourceFile', 'resourceLink'],
          pageSize: 100,
        })
        .all(),
    ]);

    const detail = {
      slug,
      title,
      subtitle,
      // You can manage hero images in Airtable later; using undefined retains the UI placeholder behavior
      image: undefined as string | undefined,
      overview,
      modules: modules.map((m: any) => ({
        id: m.id,
        name: (m.get('moduleName') as string) || '',
        duration: (m.get('moduleLength') as string) || undefined,
        description: undefined as string | undefined,
        url:
          (typeof m.fields['moduleLink'] === 'string' ? m.fields['moduleLink'] : undefined) ||
          firstAttachmentUrl(m.get('moduleFile')) ||
          undefined,
      })),
      manuals: manuals.map((doc: any) => ({
        id: doc.id,
        name: (doc.get('protocolName') as string) || '',
        fileUrl:
          (typeof doc.fields['fileLink'] === 'string' ? doc.fields['fileLink'] : undefined) ||
          firstAttachmentUrl(doc.get('protocolFile')) ||
          undefined,
      })),
      forms: forms.map((f: any) => ({
        id: f.id,
        name: (f.get('formName') as string) || '',
        category: (f.get('formCategory') as string) || undefined,
        fileUrl:
          (typeof f.fields['formLink'] === 'string' ? f.fields['formLink'] : undefined) ||
          firstAttachmentUrl(f.get('formFile')) ||
          undefined,
      })),
      resources: resources.map((r: any) => ({
        id: r.id,
        name: (r.get('resourceName') as string) || '',
        type: undefined as string | undefined,
        url:
          (typeof r.fields['resourceLink'] === 'string' ? r.fields['resourceLink'] : undefined) ||
          firstAttachmentUrl(r.get('resourceFile')) ||
          undefined,
      })),
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify(detail));
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('API /clinical-programs error:', err?.message || err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}