import { useState, useMemo } from 'react';
import type { PageTemplate, BlockContainer, BlockCombination } from '@/types/schema';
import { BLOCK_COMBINATIONS } from '@/types/schema';
import { useSchemaStore } from '@/store/schemaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Box } from 'lucide-react';

export function PageTemplatesTab() {
  const templates = useSchemaStore((s) => s.pageTemplates);
  const pageFields = useSchemaStore((s) => s.pageFields);
  const blockTemplates = useSchemaStore((s) => s.blockTemplates);
  const addTemplate = useSchemaStore((s) => s.addPageTemplate);
  const updateTemplate = useSchemaStore((s) => s.updatePageTemplate);
  const deleteTemplate = useSchemaStore((s) => s.deletePageTemplate);
  const blockFields = useSchemaStore((s) => s.blockFields);

  const allIds = useMemo(() => [
    ...blockFields.map((f) => f.id),
    ...pageFields.map((f) => f.id),
    ...blockTemplates.map((t) => t.id),
    ...templates.map((t) => t.id),
    ...templates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
  ], [blockFields, pageFields, blockTemplates, templates]);

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Page Templates
          <span className="ml-2 text-sm text-muted-foreground font-normal">({templates.length})</span>
        </h2>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />New Template
          </Button>
        )}
      </div>

      {creating && (
        <PageTemplateEditor
          pageFields={pageFields}
          blockTemplates={blockTemplates}
          existingIds={allIds}
          onSave={(t) => { addTemplate(t); setCreating(false); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {templates.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground"><p>No page templates yet.</p></div>
      )}

      {templates.map((t) =>
        editing === t.id ? (
          <PageTemplateEditor
            key={t.id}
            template={t}
            pageFields={pageFields}
            blockTemplates={blockTemplates}
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
              {t.blockContainers.length > 0 && (
                <span className="text-xs text-accent flex items-center gap-1"><Box className="w-3 h-3" />{t.blockContainers.length} containers</span>
              )}
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

function PageTemplateEditor({
  template,
  pageFields,
  blockTemplates,
  existingIds,
  onSave,
  onCancel,
}: {
  template?: PageTemplate;
  pageFields: { id: string; name: { en: string } }[];
  blockTemplates: { id: string; name: { en: string } }[];
  existingIds: string[];
  onSave: (t: PageTemplate) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(template?.id ?? '');
  const [nameSv, setNameSv] = useState(template?.name.sv ?? '');
  const [nameEn, setNameEn] = useState(template?.name.en ?? '');
  const [selectedFields, setSelectedFields] = useState<string[]>(template?.fields ?? []);
  const [blockContainers, setBlockContainers] = useState<BlockContainer[]>(template?.blockContainers ?? []);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const errs: string[] = [];
    const trimmedId = id.trim();
    if (!trimmedId) errs.push('ID is required');
    else if (!/^[A-Z_][A-Za-z0-9_]*$/.test(trimmedId))
      errs.push('ID must start with uppercase letter or underscore, then letters/numbers/underscores only');
    if (!template && existingIds.includes(trimmedId)) errs.push('ID already exists');
    if (!nameEn.trim()) errs.push('English name is required');
    for (const bc of blockContainers) {
      const bcId = bc.id.trim();
      if (!bcId) errs.push('Block container ID is required');
      else if (!/^[A-Z_][A-Za-z0-9_]*$/.test(bcId))
        errs.push(`Block container ID "${bcId}" must start with uppercase letter or underscore`);
    }
    if (errs.length) { setErrors(errs); return; }
    onSave({
      id: trimmedId,
      name: { sv: nameSv.trim(), en: nameEn.trim() },
      fields: selectedFields,
      blockContainers: blockContainers.map((bc) => ({
        ...bc,
        id: bc.id.trim(),
        name: {
          sv: (bc.name?.sv ?? bc.id).trim() || bc.id.trim(),
          en: (bc.name?.en ?? bc.id).trim() || bc.id.trim(),
        },
        combination: bc.combination ?? 'IncludeSelected',
      })),
    });
  };

  const toggleField = (fid: string) =>
    setSelectedFields((s) => s.includes(fid) ? s.filter((x) => x !== fid) : [...s, fid]);

  const addContainer = () => setBlockContainers([
    ...blockContainers,
    { id: '', name: { sv: '', en: '' }, combination: 'IncludeSelected', allowedBlocks: [] },
  ]);
  const removeContainer = (i: number) => setBlockContainers(blockContainers.filter((_, idx) => idx !== i));
  const updateContainer = (i: number, patch: Partial<BlockContainer>) =>
    setBlockContainers(blockContainers.map((bc, idx) => idx === i ? { ...bc, ...patch } : bc));
  const toggleContainerBlock = (i: number, bid: string) =>
    setBlockContainers(blockContainers.map((bc, idx) =>
      idx === i ? { ...bc, allowedBlocks: bc.allowedBlocks.includes(bid) ? bc.allowedBlocks.filter((x) => x !== bid) : [...bc.allowedBlocks, bid] } : bc
    ));

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

      {/* Page Fields */}
      <div>
        <Label className="text-sm font-semibold">Page Fields</Label>
        {pageFields.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-1">Create page fields first.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {pageFields.map((f) => {
              const sel = selectedFields.includes(f.id);
              return (
                <button key={f.id} type="button" onClick={() => toggleField(f.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${sel ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-secondary-foreground hover:border-muted-foreground'}`}
                >{f.id}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Containers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Block Containers</Label>
          <Button variant="outline" size="sm" onClick={addContainer}><Plus className="w-3 h-3 mr-1" />Add Container</Button>
        </div>
        {blockContainers.map((bc, i) => (
          <div key={i} className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <Label className="text-xs">Container ID</Label>
                <Input
                  value={bc.id}
                  onChange={(e) => updateContainer(i, { id: e.target.value })}
                  className="font-mono text-sm"
                  placeholder="e.g. MainContent"
                />
              </div>
              <div>
                <Label className="text-xs">Name (SV)</Label>
                <Input
                  value={bc.name?.sv ?? ''}
                  onChange={(e) => updateContainer(i, { name: { sv: e.target.value, en: bc.name?.en ?? '' } })}
                />
              </div>
              <div>
                <Label className="text-xs">Name (EN)</Label>
                <Input
                  value={bc.name?.en ?? ''}
                  onChange={(e) => updateContainer(i, { name: { sv: bc.name?.sv ?? '', en: e.target.value } })}
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Combination</Label>
                  <select
                    value={bc.combination ?? 'IncludeSelected'}
                    onChange={(e) => updateContainer(i, { combination: e.target.value as BlockCombination })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {BLOCK_COMBINATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeContainer(i)} className="text-destructive shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Allowed Block Templates</Label>
              {blockTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">Create block templates first.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {blockTemplates.map((bt) => {
                    const sel = bc.allowedBlocks.includes(bt.id);
                    return (
                      <button key={bt.id} type="button" onClick={() => toggleContainerBlock(i, bt.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${sel ? 'bg-accent/20 border-accent text-accent' : 'bg-secondary border-border text-secondary-foreground hover:border-muted-foreground'}`}
                      >{bt.id}</button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave}>{template ? 'Update' : 'Create'}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
