import { useRef } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import { validateSchema, type SchemaExport } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ImportExport() {
  const exportJSON = useSchemaStore((s) => s.exportJSON);
  const importJSON = useSchemaStore((s) => s.importJSON);
  const validate = useSchemaStore((s) => s.validate);
  const syncSystemBaseline = useSchemaStore((s) => s.syncSystemBaseline);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSyncSystem = () => {
    const result = syncSystemBaseline({ seedTemplatesIfEmpty: true });
    const fieldsAdded =
      result.productFieldsAdded + result.pageFieldsAdded + result.blockFieldsAdded;
    const templatesAdded =
      result.productTemplatesAdded + result.pageTemplatesAdded + result.blockTemplatesAdded;
    if (fieldsAdded === 0 && templatesAdded === 0) {
      toast.message('System baseline already in sync');
      return;
    }
    toast.success('Synced Litium baseline', {
      description: [
        fieldsAdded > 0 ? `+${fieldsAdded} fields` : null,
        templatesAdded > 0 ? `+${templatesAdded} templates` : null,
      ].filter(Boolean).join(' · '),
    });
  };

  const handleExport = () => {
    const result = validate();
    if (!result.valid) {
      toast.error('Cannot export: schema has validation errors', {
        description: result.errors.slice(0, 5).join(' • ') + (result.errors.length > 5 ? ` …(+${result.errors.length - 5} more)` : ''),
      });
      return;
    }
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'litium-schema.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Schema exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SchemaExport;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON');
        }
        if (!Array.isArray(data.blockFields) || !Array.isArray(data.pageFields) ||
            !Array.isArray(data.blockTemplates) || !Array.isArray(data.pageTemplates)) {
          throw new Error('Invalid schema arrays');
        }
        const productFields = Array.isArray(data.productFields) ? data.productFields : [];
        const productTemplates = Array.isArray(data.productTemplates) ? data.productTemplates : [];
        const result = validateSchema({
          blockFields: data.blockFields,
          pageFields: data.pageFields,
          blockTemplates: data.blockTemplates,
          pageTemplates: data.pageTemplates,
          productFields,
          productTemplates,
        });
        if (!result.valid) {
          toast.error('Imported JSON failed validation', {
            description: result.errors.slice(0, 5).join(' • ') + (result.errors.length > 5 ? ` …(+${result.errors.length - 5} more)` : ''),
          });
          return;
        }
        importJSON({ ...data, productFields, productTemplates });
        toast.success('Schema imported successfully');
      } catch (err) {
        toast.error('Invalid JSON file', {
          description: err instanceof Error ? err.message : 'Please check the format.',
        });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSyncSystem} title="Sync Litium system fields">
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Sync system
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-3.5 h-3.5 mr-1.5" />Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="w-3.5 h-3.5 mr-1.5" />Import
      </Button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
