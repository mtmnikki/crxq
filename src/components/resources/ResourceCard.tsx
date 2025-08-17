/**
 * ResourceCard
 * - Compact card to display a single resource without exposing record IDs.
 * - Shows resource name, optional description/type, attachment count, and a Download action.
 */

import { Download, File as FileIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export interface ResourceCardProps {
  /** Resource name/title */
  name: string;
  /** Optional description text */
  description?: string;
  /** Optional type name (e.g., PDF, Form, Video) */
  type?: string;
  /** Attachment count */
  fileCount: number;
  /** First file URL (for quick download) */
  firstUrl?: string;
}

export default function ResourceCard(props: ResourceCardProps) {
  const { name, description, type, fileCount, firstUrl } = props;

  return (
    <Card className="overflow-hidden hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{name}</div>
            {description ? <div className="text-xs text-slate-500 truncate">{description}</div> : null}

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <Badge variant="outline" className="bg-transparent">{fileCount} file{fileCount === 1 ? '' : 's'}</Badge>
              {type ? <Badge variant="secondary">{type}</Badge> : null}
            </div>
          </div>

          {firstUrl ? (
            <a href={firstUrl} target="_blank" rel="noreferrer" className="shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-cyan-400 hover:text-cyan-600 bg-transparent"
                title="Download"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
