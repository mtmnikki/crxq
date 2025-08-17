/**
 * Airtable configuration and client factory
 * - Exposes base/table/field IDs for this project.
 * - Uses airtable.js for direct client access where needed.
 * - Reads Base ID and PAT (Personal Access Token) from localStorage.
 */

import Airtable from 'airtable';

/**
 * Default production base ID for this project (updated to the new base).
 * Source: provided base metadata (appuo6esxsc55yCgI).
 */
export const AIRTABLE_BASE_ID = 'appuo6esxsc55yCgI';

/**
 * Get Airtable Base ID.
 * Reads from localStorage.AIRTABLE_BASE_ID, falls back to DEFAULT_AIRTABLE_BASE_ID.
 */
export function getAirtableBaseId(): string {
  try {
    return localStorage.getItem('AIRTABLE_BASE_ID') || DEFAULT_AIRTABLE_BASE_ID;
  } catch {
    return AIRTABLE_BASE_ID;
  }
}

/**
 * Get Airtable Personal Access Token (PAT) from localStorage.
 */
export function getAirtableToken(): string | null {
  try {
    return localStorage.getItem('AIRTABLE_API_KEY');
  } catch {
    return null;
  }
}

/**
 * Create an Airtable Base client using the official airtable.js package.
 * Throws if PAT is missing, so callers can present a clear error.
 */
export function getAirtableBase(): Airtable.Base {
  const apiKey = getAirtableToken();
  const baseId = getAirtableBaseId();

  if (!apiKey) {
    throw new Error('Airtable PAT not found. Set it in this browser.');
  }

  const airtable = new Airtable({ apiKey });
  return airtable.base(baseId);
}

/**
 * Stable Members table ID in this base (updated).
 * Source: schema (memberAccounts -> tblxoJz15zMr6CeeV).
 */
export const MEMBERS_TABLE_ID = 'tblxoJz15zMr6CeeV';

/**
 * Field IDs for memberAccounts table (stable even if labels change).
 * Source: provided schema for base appuo6esxsc55yCgI.
 */
export const MembersFieldIds = {
  memberID: 'fldXUBCgaMwNJUJxf',
  temporaryPassword: 'fldx139PuTqJcH8jA', // "Temp Password"
  passwordHash: 'fldExgYYdxtZSIsPE',
  pharmacistFirst: 'fld3O5fcRKLUL5mVz', // firstName
  pharmacistLast: 'fldKRPy23W3qwTqN6', // lastName
  email: 'fldn55xDaXjqTHb2O', // "Email Address"
  memberPhone: 'fldo0qBKqxYczuXq8', // Primary Contact Phone Number
  registrationDate: 'fldb8pFnu3GUakceP', // createdTime
  lastLogin: 'fldb0j5XwlKclqKlQ', // lastActivity (used as "Last Login" equivalent)
  subscriptionStatus: 'fldKbzgtYIRkJOalj',
  subscriptionStart: '', // not present in provided schema
  subscriptionEnd: 'fldRhWszAxjFgdpBD',
  pharmacyName: 'flds16myqpFa2qzIw',
  pharmacyPhone: 'fldrYzhAI8LuVJtIf',
  pharmacyAddress1: 'fldeJJM8wAgZF7zK8',
  pharmacyCity: 'fldRkcWOqMbw52gkM',
  pharmacyState: 'fld7K4WE4nyl2KoO2',
  pharmacyZip: 'fldUGatTXk8RCfpse',
  techFirst: '', // not present in provided schema
  techLast: '', // not present in provided schema
} as const;

/**
 * TABLE_IDS: Centralized table ID references used across the app.
 * - programs: "ClinicalPrograms" table ID (new base)
 * - members: "memberAccounts" table ID
 */
export const TABLE_IDS = {
  programs: 'tblXsjw9EvEX1JnCy', // ClinicalPrograms
  members: MEMBERS_TABLE_ID,
} as const;

/**
 * FIELD_IDS: Field ID maps by table used in pages/services.
 * Program fields are taken from the new "ClinicalPrograms" schema.
 * Note: Some UI paths currently use name-based REST and do not rely on these.
 */
export const FIELD_IDS = {
  programs: {
    name: 'fldZMC178eiIyTq3w',           // programName
    description: 'fldVNSdftxLraYp6P',    // programDescription
    level: 'fldAxTeupBBeP9XDb',          // experienceLevel
    summary: 'fldNRUwiQcesXso0s',        // programOverview
    photo: '',                           // not defined in provided schema
    sortOrder: '',                       // not defined on program record (modules have sortOrder)
    assets: '',                          // not defined in provided schema
    slug: 'fldqrANZRsEuolDR6',           // programSlug
  },
} as const;
