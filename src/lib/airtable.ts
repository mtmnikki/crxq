/**
 * Minimal Airtable REST client (browser + runtime PAT/Base ID)
 * - Performs direct fetch calls in the browser using Authorization: Bearer <PAT>, matching official docs.
 * - Enforces Airtable rate limits with a small client-side limiter (5 req/s → 220ms min spacing).
 * - Adds retry logic for 429 (wait 30s, retry) and 5xx (exponential backoff).
 * - Uses returnFieldsByFieldId=true for reads so fields are keyed by Field IDs.
 */

import { getAirtableBaseId, getAirtableToken } from '../config/airtableConfig';

/** Generic Airtable record keyed by Field IDs */
export interface AirtableRecord<TFields = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: TFields;
}

interface ListResponse<TFields> {
  records: AirtableRecord<TFields>[];
  offset?: string;
}

/** Rate limiting config (5 req/s per base → ~200ms; we use 220ms for safety) */
const RATE_LIMIT_MIN_SPACING_MS = 220;
/** Retry config */
const MAX_RETRIES = 2;
const RETRY_BACKOFF_BASE_MS = 500;

/** Internal clock for next available timeslot */
let nextAvailableTs = 0;

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Acquire a rate-limit slot to keep requests under 5 req/s per base.
 */
async function acquireRateLimitSlot(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextAvailableTs - now);
  if (wait > 0) {
    await sleep(wait);
  }
  nextAvailableTs = Date.now() + RATE_LIMIT_MIN_SPACING_MS;
}

/**
 * Build table URL with query params (returnFieldsByFieldId always true for reads).
 */
function buildTableUrl(
  tableId: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const baseId = getAirtableBaseId();
  const sp = new URLSearchParams();
  sp.set('returnFieldsByFieldId', 'true');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sp.append(k, String(v));
    });
  }
  return `https://api.airtable.com/v0/${baseId}/${tableId}?${sp.toString()}`;
}

/**
 * Build record URL with query params (returnFieldsByFieldId always true for reads).
 */
function buildRecordUrl(
  tableId: string,
  recordId: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const sp = new URLSearchParams();
  sp.set('returnFieldsByFieldId', 'true');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sp.append(k, String(v));
    });
  }
  const query = sp.toString();
  return `https://api.airtable.com/v0/${getAirtableBaseId()}/${tableId}/${recordId}?${query}`;
}

/**
 * Authorized fetch to Airtable returning typed JSON.
 * - Respects rate limits (client-side).
 * - Retries on 429 (wait 30s then retry) and on 5xx (exponential backoff).
 */
async function airtableFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const token = getAirtableToken();
  if (!token) {
    throw new Error(
      'Airtable PAT not found. Please set it with localStorage.setItem("AIRTABLE_PAT", "<your_pat>").'
    );
  }

  let attempt = 0;
  // Retry loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await acquireRateLimitSlot();

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    // Prepare error text (best effort)
    const errText = await res.text().catch(() => '');

    // 429 handling: official docs indicate waiting 30 seconds
    if (res.status === 429 && attempt < MAX_RETRIES) {
      attempt += 1;
      await sleep(30000);
      continue;
    }

    // 5xx handling: exponential backoff
    if (res.status >= 500 && res.status < 600 && attempt < MAX_RETRIES) {
      const delay = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt); // 500ms, 1000ms...
      attempt += 1;
      await sleep(delay);
      continue;
    }

    throw new Error(`Airtable error ${res.status}: ${errText || res.statusText}`);
  }
}

/**
 * List records from a table with optional pagination/filtering.
 * - fields[] expects Field IDs when returnFieldsByFieldId=true.
 */
export async function listRecords<TFields = Record<string, unknown>>(opts: {
  tableId: string;
  pageSize?: number;
  offset?: string;
  filterByFormula?: string;
  fields?: string[]; // Field IDs
  view?: string;
  sort?: { field: string; direction?: 'asc' | 'desc' }[];
}): Promise<ListResponse<TFields>> {
  const params: Record<string, string> = {};
  if (opts.pageSize) params['pageSize'] = String(opts.pageSize);
  if (opts.offset) params['offset'] = String(opts.offset);
  if (opts.filterByFormula) params['filterByFormula'] = opts.filterByFormula;
  if (opts.view) params['view'] = opts.view;
  if (opts.sort && opts.sort.length) {
    opts.sort.forEach((s, i) => {
      params[`sort[${i}][field]`] = s.field;
      if (s.direction) params[`sort[${i}][direction]`] = s.direction;
    });
  }

  let url = buildTableUrl(opts.tableId, params);
  if (opts.fields?.length) {
    const append = opts.fields.map((f) => `fields[]=${encodeURIComponent(f)}`).join('&');
    url = `${url}&${append}`;
  }
  return airtableFetch<ListResponse<TFields>>(url);
}

/**
 * Get a single record by Record ID.
 */
export async function getRecord<TFields = Record<string, unknown>>(opts: {
  tableId: string;
  recordId: string;
  fields?: string[];
}): Promise<AirtableRecord<TFields>> {
  let url = buildRecordUrl(opts.tableId, opts.recordId);
  if (opts.fields?.length) {
    const append = opts.fields.map((f) => `fields[]=${encodeURIComponent(f)}`).join('&');
    url = `${url}&${append}`;
  }
  return airtableFetch<AirtableRecord<TFields>>(url);
}

/**
 * List records by a set of Record IDs via OR(RECORD_ID()='...').
 */
export async function listRecordsByIds<TFields = Record<string, unknown>>(opts: {
  tableId: string;
  recordIds: string[];
  fields?: string[];
}): Promise<ListResponse<TFields>> {
  if (!opts.recordIds.length) return { records: [] };
  const formula = `OR(${opts.recordIds.map((id) => `RECORD_ID()='${id}'`).join(',')})`;
  return listRecords<TFields>({
    tableId: opts.tableId,
    filterByFormula: formula,
    fields: opts.fields,
    pageSize: 100,
  });
}

/**
 * List all records across pages (with optional max cap).
 */
export async function listAllRecords<TFields = Record<string, unknown>>(opts: {
  tableId: string;
  pageSize?: number;
  maxRecords?: number;
  filterByFormula?: string;
  fields?: string[];
  view?: string;
  sort?: { field: string; direction?: 'asc' | 'desc' }[];
}): Promise<AirtableRecord<TFields>[]> {
  const pageSize = Math.min(Math.max(opts.pageSize || 100, 1), 100);
  let offset: string | undefined = undefined;
  const out: AirtableRecord<TFields>[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await listRecords<TFields>({
      tableId: opts.tableId,
      pageSize,
      offset,
      filterByFormula: opts.filterByFormula,
      fields: opts.fields,
      view: opts.view,
      sort: opts.sort,
    });
    out.push(...res.records);
    if (opts.maxRecords && out.length >= opts.maxRecords) {
      return out.slice(0, opts.maxRecords);
    }
    if (!res.offset) break;
    offset = res.offset;
  }
  return out;
}

/**
 * Update a record by Record ID using field names in the payload.
 * - For simple writes like "Last Login".
 */
export async function updateRecordByNames<TFields = Record<string, unknown>>(opts: {
  tableId: string;
  recordId: string;
  fields: Record<string, unknown>; // field names, not IDs
  returnFieldsByFieldId?: boolean;
}): Promise<AirtableRecord<TFields>> {
  const baseId = getAirtableBaseId();
  const sp = new URLSearchParams();
  if (opts.returnFieldsByFieldId) sp.set('returnFieldsByFieldId', 'true');
  const url = `https://api.airtable.com/v0/${baseId}/${opts.tableId}/${opts.recordId}?${sp.toString()}`;
  // Note: update is also rate-limited/retried via airtableFetch
  return airtableFetch<AirtableRecord<TFields>>(url, {
    method: 'PATCH',
    body: JSON.stringify({ fields: opts.fields }),
  });
}

/**
 * Attachment helper simplified type.
 */
export type SimpleAttachment = { id: string; url: string; filename: string };

/**
 * Safely extract attachments from a field value.
 */
export function getAttachmentArray(fieldValue: unknown): SimpleAttachment[] {
  if (!Array.isArray(fieldValue)) return [];
  return fieldValue
    .map((a) => {
      if (a && typeof a === 'object') {
        const id = (a as any).id as string | undefined;
        const url = (a as any).url as string | undefined;
        const filename = (a as any).filename as string | undefined;
        if (id && url && filename) return { id, url, filename };
      }
      return null;
    })
    .filter(Boolean) as SimpleAttachment[];
}
