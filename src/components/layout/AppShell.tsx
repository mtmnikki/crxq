/**
 * AppShell
 * - Purpose: Provide a fixed left sidebar layout for gated/member pages.
 * - Desktop-dense pass:
 *   - Sidebar remains fixed.
 *   - Main content uses a compact, desktop-first scale (smaller font + paddings).
 *   - Wider container to use horizontal space on large screens.
 */

import React from 'react';

interface AppShellProps {
  /** Left sidebar content (e.g., MemberSidebar) */
  sidebar?: React.ReactNode;
  /** Optional top header bar for the page */
  header?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
}

/**
 * Fixed-width left rail used for both the aside and main area offset.
 * Reduced slightly to increase the working canvas.
 */
const SIDEBAR_WIDTH_PX = 256;

export default function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Fixed left sidebar */}
      {sidebar ? (
        <aside
          className="fixed inset-y-0 left-0 z-40 w-[256px] border-r border-slate-800 bg-slate-900"
          aria-label="Primary member navigation"
        >
          {/* Inner scroll area for long menus while keeping the frame static */}
          <div className="h-full overflow-y-auto">
            {sidebar}
          </div>
        </aside>
      ) : null}

      {/* Main area offset by the sidebar width */}
      <div
        className="min-h-screen"
        style={{ paddingLeft: sidebar ? `${SIDEBAR_WIDTH_PX}px` : undefined }}
      >
        {/* Optional sticky header bar (page-level) */}
        {header ? (
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            {header}
          </div>
        ) : null}

        {/* Page content container */}
        <main className="mx-auto w-full max-w-[1440px] px-3 py-4 text-[13px]">
          {children}
        </main>
      </div>
    </div>
  );
}
