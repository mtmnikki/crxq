/**
 * Api mock service
 * - Purpose: Provide Dashboard with realistic demo data without external dependencies.
 * - Replace these methods with real integrations when ready.
 */

import { Announcement, ClinicalProgram, QuickAccessItem, RecentActivity, ResourceItem } from './types';

/**
 * Simulate async latency
 */
function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Api methods
 */
export const Api = {
  /** Get Clinical Programs */
  async getPrograms(): Promise<ClinicalProgram[]> {
    await wait(200);
    return [
      {
        slug: 'mtm-future-today',
        name: 'MTM The Future Today',
        description: 'Team-based Medication Therapy Management with proven protocols and technician workflows.',
        icon: 'ClipboardCheck',
        resourceCount: 18,
        lastUpdatedISO: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
      },
      {
        slug: 'timemymeds',
        name: 'TimeMyMeds Sync',
        description: 'Appointment-based care via synchronization workflows that unlock clinical service delivery.',
        icon: 'CalendarCheck',
        resourceCount: 12,
        lastUpdatedISO: new Date(Date.now() - 86400 * 1000 * 10).toISOString(),
      },
      {
        slug: 'test-and-treat',
        name: 'Test & Treat Services',
        description: 'CLIA-waived testing and treatment plans for Flu, Strep, and COVID-19.',
        icon: 'Stethoscope',
        resourceCount: 15,
        lastUpdatedISO: new Date(Date.now() - 86400 * 1000 * 6).toISOString(),
      },
      {
        slug: 'hba1c-testing',
        name: 'HbA1c Testing',
        description: 'POC A1c testing integrated with diabetes care and MTM workflows.',
        icon: 'Activity',
        resourceCount: 9,
        lastUpdatedISO: new Date(Date.now() - 86400 * 1000 * 18).toISOString(),
      },
    ];
  },

  /** Get Quick Access tiles */
  async getQuickAccess(): Promise<QuickAccessItem[]> {
    await wait(150);
    return [
      { id: 'qa-1', title: 'CMR Pharmacist Protocol', subtitle: 'MTM Protocols', cta: 'Download', icon: 'FileText' },
      { id: 'qa-2', title: 'Technician Training Module 1', subtitle: 'Onboarding', cta: 'Watch', icon: 'PlayCircle' },
      { id: 'qa-3', title: 'A1c Patient Handout', subtitle: 'Diabetes Care', cta: 'Download', icon: 'FileSpreadsheet' },
      { id: 'qa-4', title: 'Flu Test Workflow', subtitle: 'Test & Treat', cta: 'Download', icon: 'TestTubes' },
    ];
  },

  /** Get Bookmarked resources for current user */
  async getBookmarkedResources(): Promise<ResourceItem[]> {
    await wait(120);
    return [
      { id: 'bm-1', name: 'MTM CMR Form (Pharmacist)', program: 'MTM' },
      { id: 'bm-2', name: 'Technician Protocol – Sync Calls', program: 'TMM' },
      { id: 'bm-3', name: 'A1c Testing Consent', program: 'A1C' },
      { id: 'bm-4', name: 'Strep Test Standing Order', program: 'TNT' },
    ];
  },

  /** Get recent activity list */
  async getRecentActivity(): Promise<RecentActivity[]> {
    await wait(160);
    const now = Date.now();
    return [
      { id: 'ra-1', name: 'CMR Interview Guide', program: 'MTM', accessedAtISO: new Date(now - 1000 * 60 * 60).toISOString() },
      { id: 'ra-2', name: 'Sync Schedule Template', program: 'TMM', accessedAtISO: new Date(now - 1000 * 60 * 60 * 5).toISOString() },
      { id: 'ra-3', name: 'A1c Tech Checklist', program: 'A1C', accessedAtISO: new Date(now - 1000 * 60 * 60 * 22).toISOString() },
    ];
  },

  /** Get announcements */
  async getAnnouncements(): Promise<Announcement[]> {
    await wait(100);
    return [
      { id: 'an-1', title: 'New: Prescriber Communication Forms', body: 'Standardized outreach templates now available in all MTM programs.', dateISO: new Date().toISOString() },
      { id: 'an-2', title: 'Sync Workflow Update', body: 'Checklist updated for latest payer guidance. Please review by month end.', dateISO: new Date(Date.now() - 86400 * 1000 * 4).toISOString() },
    ];
  },
};
