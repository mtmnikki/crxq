/**
 * AirtableStatus
 * - Small status pill showing Airtable connectivity from the browser.
 * - Uses Metadata API to verify PAT/Base ID work.
 * - Reusable across pages (e.g., Login, Dashboard, DevConfig).
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Signal } from 'lucide-react';
import { Button } from './button';
import { testAirtableConnectivity, AirtableTestResult } from '../../services/airtable/testConnection';
import { getAirtableBaseId, getAirtableToken } from '../../config/airtableConfig';
import { toast } from 'sonner';

interface AirtableStatusProps {
  /** Show text next to the icon */
  showLabel?: boolean;
  /** Optional custom className on wrapper */
  className?: string;
  /** Size of the chip */
  size?: 'sm' | 'md';
}

/**
 * Visual helper for color classes based on state.
 */
function stateStyles(ok: boolean, problem?: AirtableTestResult['problem']) {
  if (ok) return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' };
  if (problem === 'no_token') return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' };
  return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' };
}

/**
 * AirtableStatus component
 */
export default function AirtableStatus({ showLabel = true, className = '', size = 'sm' }: AirtableStatusProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AirtableTestResult | null>(null);

  /** Run an immediate check on mount */
  useEffect(() => {
    void handleCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Trigger a test and update UI */
  async function handleCheck(): Promise<void> {
    setLoading(true);
    const res = await testAirtableConnectivity();
    setResult(res);
    setLoading(false);
  }

  const ok = !!result?.ok;
  const styles = stateStyles(ok, result?.problem);
  const baseId = getAirtableBaseId();
  const hasToken = !!getAirtableToken();

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 ${size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm'} ${styles.bg} ${styles.text} ring-1 ${styles.ring} ${className}`}
      aria-live="polite"
      title={
        ok
          ? `Connected to Airtable (base ${baseId}).`
          : result?.message || (hasToken ? 'Airtable not reachable.' : 'Airtable PAT missing.')
      }
    >
      <span className="inline-flex items-center">
        {loading ? (
          <Signal className="h-4 w-4 animate-pulse" />
        ) : ok ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : result?.problem === 'no_token' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
      </span>
      {showLabel && (
        <span className="truncate">
          {loading
            ? 'Checking...'
            : ok
              ? 'Airtable: Connected'
              : result?.problem === 'no_token'
                ? 'Airtable: Missing PAT'
                : 'Airtable: Error'}
        </span>
      )}
      <Button
        variant="outline"
        className="bg-transparent h-6 px-2 py-0 ml-1"
        onClick={() => {
          void handleCheck().then(() => {
            if (!ok && result?.message) toast.error(result.message);
          });
        }}
        disabled={loading}
        title="Re-check"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
