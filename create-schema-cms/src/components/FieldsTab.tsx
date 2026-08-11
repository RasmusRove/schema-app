import { useState, useMemo } from 'react';
import type { FieldDefinition } from '@/types/schema';
import { useSchemaStore } from '@/store/schemaStore';
import { FieldEditor } from './FieldEditor';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';

interface FieldsTabProps {
  scope: 'block' | 'page' | 'product';
}

export function FieldsTab({ scope }: FieldsTabProps) {
  const fields = useSchemaStore((s) =>
    scope === 'block' ? s.blockFields : scope === 'page' ? s.pageFields : s.productFields
  );
  const addField = useSchemaStore((s) =>
    scope === 'block' ? s.addBlockField : scope === 'page' ? s.addPageField : s.addProductField
  );
  const updateField = useSchemaStore((s) =>
    scope === 'block' ? s.updateBlockField : scope === 'page' ? s.updatePageField : s.updateProductField
  );
  const deleteField = useSchemaStore((s) =>
    scope === 'block' ? s.deleteBlockField : scope === 'page' ? s.deletePageField : s.deleteProductField
  );
  const blockFields = useSchemaStore((s) => s.blockFields);
  const pageFields = useSchemaStore((s) => s.pageFields);
  const productFields = useSchemaStore((s) => s.productFields);
  const blockTemplates = useSchemaStore((s) => s.blockTemplates);
  const pageTemplates = useSchemaStore((s) => s.pageTemplates);
  const productTemplates = useSchemaStore((s) => s.productTemplates);

  const allIds = useMemo(() => [
    ...blockFields.map((f) => f.id),
    ...pageFields.map((f) => f.id),
    ...productFields.map((f) => f.id),
    ...blockTemplates.map((t) => t.id),
    ...pageTemplates.map((t) => t.id),
    ...productTemplates.map((t) => t.id),
    ...pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
  ], [blockFields, pageFields, productFields, blockTemplates, pageTemplates, productTemplates]);

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSave = (f: FieldDefinition) => {
    if (editing) {
      updateField(editing, f);
      setEditing(null);
    } else {
      addField(f);
      setCreating(false);
    }
  };

  const handleDuplicate = (f: FieldDefinition) => {
    let newId = f.id + 'Copy';
    let counter = 1;
    while (allIds.includes(newId)) {
      newId = `${f.id}Copy${counter++}`;
    }
    addField({ ...f, id: newId });
  };

  const label = scope === 'block' ? 'Block' : scope === 'page' ? 'Page' : 'Product';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {label} Fields
          <span className="ml-2 text-sm text-muted-foreground font-normal">({fields.length})</span>
        </h2>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />New Field
          </Button>
        )}
      </div>

      {creating && (
        <FieldEditor scope={scope} onSave={handleSave} onCancel={() => setCreating(false)} />
      )}

      {fields.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {scope} fields defined yet.</p>
          <p className="text-sm mt-1">Click "New Field" to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {fields.map((f) =>
          editing === f.id ? (
            <FieldEditor
              key={f.id}
              field={f}
              scope={scope}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-muted-foreground/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono text-primary">{f.id}</code>
                <span className="text-sm">{f.name.en}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{f.type}</span>
                {f.systemDefined && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">System</span>
                )}
                {f.multiLanguage && (
                  <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">Multi-lang</span>
                )}
                {f.multiSelect && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Multi-select</span>
                )}
                {f.entityType && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{f.entityType}</span>
                )}
              </div>
              <div className="flex gap-1">
                {!f.systemDefined && (
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(f)} title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setEditing(f.id)} title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {!f.systemDefined && (
                  <Button variant="ghost" size="icon" onClick={() => deleteField(f.id)} className="text-destructive" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
