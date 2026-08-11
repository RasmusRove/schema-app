import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSchemaStore } from '@/store/schemaStore';
import { Button } from '@/components/ui/button';
import { Code, X } from 'lucide-react';

export function JsonPreview() {
  const [open, setOpen] = useState(false);
  const exportJSON = useSchemaStore((s) => s.exportJSON);

  const json = useMemo(() => {
    if (!open) return '';
    return JSON.stringify(exportJSON(), null, 2);
  }, [open, exportJSON]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Code className="w-3.5 h-3.5 mr-1.5" />Preview JSON
      </Button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="JSON Preview"
            className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              <span className="text-sm font-semibold">JSON Preview</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <pre className="p-4 overflow-auto flex-1 text-xs font-mono text-foreground/90">
              {json}
            </pre>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
