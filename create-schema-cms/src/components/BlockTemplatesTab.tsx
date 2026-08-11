import { useState, useMemo } from 'react';
import type { BlockTemplate } from '@/types/schema';
import { useSchemaStore } from '@/store/schemaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function BlockTemplatesTab() {
  const templates = useSchemaStore((s) => s.blockTemplates);
  const blockFields = useSchemaStore((s) => s.blockFields);
  const addTemplate = useSchemaStore((s) => s.addBlockTemplate);
  const updateTemplate = useSchemaStore((s) => s.updateBlockTemplate);
  const deleteTemplate = useSchemaStore((s) => s.deleteBlockTemplate);
  const pageFields = useSchemaStore((s) => s.pageFields);
  const pageTemplates = useSchemaStore((s) => s.pageTemplates);

  const allIds = useMemo(() => [
    ...blockFields.map((f) => f.id),
    ...pageFields.map((f) => f.id),
    ...templates.map((t) => t.id),
    ...pageTemplates.map((t) => t.id),
    ...pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
  ], [blockFields, pageFields, templates, pageTemplates]);

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Block Templates
          <span className="ml-2 text-sm text-muted-foreground font-normal">({templates.length})</span>
        </h2>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />New Template
          </Button>
        )}
      </div>

      {creating && (
        <TemplateEditor
          availableFields={blockFields}
          existingIds={allIds}
          onSave={(t) => { addTemplate(t); setCreating(false); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {templates.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No block templates yet.</p>
        </div>
      )}

      {templates.map((t) =>
        editing === t.id ? (
          <TemplateEditor
            key={t.id}
            template={t}
            availableFields={blockFields}
            existingIds={allIds}
            onSave={(updated) => { updateTemplate(t.id, updated); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono text-primary">{t.id}</code>
              <span className="text-sm">{t.name.en}</span>
              <span className="text-xs text-muted-foreground">{t.fields.length} fields</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditing(t.id)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  availableFields,
  existingIds,
  onSave,
  onCancel,
}: {
  template?: BlockTemplate;
  availableFields: { id: string; name: { en: string } }[];
  existingIds: string[];
  onSave: (t: BlockTemplate) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(template?.id ?? '');
  const [nameSv, setNameSv] = useState(template?.name.sv ?? '');
  const [nameEn, setNameEn] = useState(template?.name.en ?? '');
  const [selectedFields, setSelectedFields] = useState<string[]>(template?.fields ?? []);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const errs: string[] = [];
    const trimmedId = id.trim();
    if (!trimmedId) errs.push('ID is required');
    else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedId))
      errs.push('ID must start with a letter or underscore, then letters/numbers/underscores only');
    if (!template && existingIds.includes(trimmedId)) errs.push('ID already exists');
    if (!nameEn.trim()) errs.push('English name is required');
    if (errs.length) { setErrors(errs); return; }
    onSave({ id: trimmedId, name: { sv: nameSv.trim(), en: nameEn.trim() }, fields: selectedFields });
  };

  const toggleField = (fid: string) =>
    setSelectedFields((s) => s.includes(fid) ? s.filter((x) => x !== fid) : [...s, fid]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      {errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><Label>ID</Label><Input value={id} onChange={(e) => setId(e.target.value)} className="font-mono text-sm" disabled={!!template} /></div>
        <div><Label>Name (SV)</Label><Input value={nameSv} onChange={(e) => setNameSv(e.target.value)} /></div>
        <div><Label>Name (EN)</Label><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Fields</Label>
        {availableFields.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-1">Create block fields first.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {availableFields.map((f) => {
              const sel = selectedFields.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleField(f.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${
                    sel ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-secondary-foreground hover:border-muted-foreground'
                  }`}
                >
                  {f.id}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave}>{template ? 'Update' : 'Create'}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
