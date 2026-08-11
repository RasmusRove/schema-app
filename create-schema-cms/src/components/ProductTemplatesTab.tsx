import { useState, useMemo } from 'react';
import type { ProductTemplate, ProductFieldGroup, FieldDefinition, ProductTemplateType } from '@/types/schema';
import { DEFAULT_PRODUCT_GROUP_ID, makeDefaultProductGroup, PRODUCT_TEMPLATE_TYPES } from '@/types/schema';
import { useSchemaStore } from '@/store/schemaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export function ProductTemplatesTab() {
  const templates = useSchemaStore((s) => s.productTemplates);
  const productFields = useSchemaStore((s) => s.productFields);
  const addTemplate = useSchemaStore((s) => s.addProductTemplate);
  const updateTemplate = useSchemaStore((s) => s.updateProductTemplate);
  const deleteTemplate = useSchemaStore((s) => s.deleteProductTemplate);
  const blockFields = useSchemaStore((s) => s.blockFields);
  const pageFields = useSchemaStore((s) => s.pageFields);
  const blockTemplates = useSchemaStore((s) => s.blockTemplates);
  const pageTemplates = useSchemaStore((s) => s.pageTemplates);

  const allIds = useMemo(() => [
    ...blockFields.map((f) => f.id),
    ...pageFields.map((f) => f.id),
    ...productFields.map((f) => f.id),
    ...blockTemplates.map((t) => t.id),
    ...pageTemplates.map((t) => t.id),
    ...templates.map((t) => t.id),
    ...pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
  ], [blockFields, pageFields, productFields, blockTemplates, pageTemplates, templates]);

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Product Templates
          <span className="ml-2 text-sm text-muted-foreground font-normal">({templates.length})</span>
        </h2>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />New Template
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Product area templates — choose type <span className="font-medium text-foreground">Product</span> or{' '}
        <span className="font-medium text-foreground">Category</span>. Both use Product Fields.
      </p>

      {creating && (
        <ProductTemplateEditor
          availableFields={productFields}
          existingIds={allIds}
          onSave={(t) => { addTemplate(t); setCreating(false); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {templates.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No product/category templates yet.</p>
        </div>
      )}

      {templates.map((t) =>
        editing === t.id ? (
          <ProductTemplateEditor
            key={t.id}
            template={t}
            availableFields={productFields}
            existingIds={allIds}
            onSave={(updated) => { updateTemplate(t.id, updated); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono text-primary">{t.id}</code>
              <span className="text-sm">{t.name.en}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded">{t.type ?? 'Product'}</span>
              <span className="text-xs text-muted-foreground">
                {(t.type ?? 'Product') === 'Category'
                  ? `${(t.fieldGroups ?? []).length} field groups`
                  : `${t.productFieldGroups.length} product / ${t.variantFieldGroups.length} variant groups`}
              </span>
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

function ProductTemplateEditor({
  template,
  availableFields,
  existingIds,
  onSave,
  onCancel,
}: {
  template?: ProductTemplate;
  availableFields: FieldDefinition[];
  existingIds: string[];
  onSave: (t: ProductTemplate) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(template?.id ?? '');
  const [nameSv, setNameSv] = useState(template?.name.sv ?? '');
  const [nameEn, setNameEn] = useState(template?.name.en ?? '');
  const [type, setType] = useState<ProductTemplateType>(template?.type ?? 'Product');
  const [productGroups, setProductGroups] = useState<ProductFieldGroup[]>(
    template?.productFieldGroups ?? [makeDefaultProductGroup()]
  );
  const [variantGroups, setVariantGroups] = useState<ProductFieldGroup[]>(
    template?.variantFieldGroups ?? [makeDefaultProductGroup()]
  );
  const [fieldGroups, setFieldGroups] = useState<ProductFieldGroup[]>(
    template?.fieldGroups ?? [makeDefaultProductGroup()]
  );
  const [useVariantUrl, setUseVariantUrl] = useState(template?.useVariantUrl ?? false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const errs: string[] = [];
    const trimmedId = id.trim();
    if (!trimmedId) errs.push('ID is required');
    else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedId))
      errs.push('ID must start with a letter or underscore, then letters/numbers/underscores only');
    if (!template && existingIds.includes(trimmedId)) errs.push('ID already exists');
    if (!nameSv.trim()) errs.push('Swedish name is required');
    if (!nameEn.trim()) errs.push('English name is required');

    const validateGroups = (groups: ProductFieldGroup[], kind: string) => {
      if (!groups.some((g) => g.id === DEFAULT_PRODUCT_GROUP_ID))
        errs.push(`${kind}: must contain default group "${DEFAULT_PRODUCT_GROUP_ID}"`);
      const seen = new Set<string>();
      for (const g of groups) {
        if (!g.id) errs.push(`${kind}: group ID is required`);
        else if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(g.id))
          errs.push(`${kind}: group ID "${g.id}" must start with a letter or underscore`);
        if (seen.has(g.id)) errs.push(`${kind}: duplicate group "${g.id}"`);
        seen.add(g.id);
        if (!g.name?.sv?.trim() || !g.name?.en?.trim())
          errs.push(`${kind} group "${g.id}": names (sv/en) required`);
      }
    };

    if (type === 'Category') {
      validateGroups(fieldGroups, 'fieldGroups');
    } else {
      validateGroups(productGroups, 'productFieldGroups');
      validateGroups(variantGroups, 'variantFieldGroups');
    }

    if (errs.length) { setErrors(errs); return; }
    onSave({
      id: trimmedId,
      name: { sv: nameSv.trim(), en: nameEn.trim() },
      type,
      productFieldGroups: productGroups,
      variantFieldGroups: variantGroups,
      fieldGroups,
      useVariantUrl: type === 'Product' ? useVariantUrl : false,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      {errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProductTemplateType)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!!template}
          >
            {PRODUCT_TEMPLATE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div><Label>ID</Label><Input value={id} onChange={(e) => setId(e.target.value)} className="font-mono text-sm" disabled={!!template} placeholder={type === 'Category' ? 'e.g. Category' : 'e.g. ProductWithVariants'} /></div>
        <div><Label>Name (SV)</Label><Input value={nameSv} onChange={(e) => setNameSv(e.target.value)} /></div>
        <div><Label>Name (EN)</Label><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
      </div>

      {type === 'Product' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="use-variant-url"
            checked={useVariantUrl}
            onChange={(e) => setUseVariantUrl(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="use-variant-url">Use variant URL</Label>
        </div>
      )}

      {type === 'Category' ? (
        <FieldGroupsEditor
          title="fieldGroups (category)"
          groups={fieldGroups}
          setGroups={setFieldGroups}
          availableFields={availableFields}
        />
      ) : (
        <>
          <FieldGroupsEditor
            title="productFieldGroups (base product)"
            groups={productGroups}
            setGroups={setProductGroups}
            availableFields={availableFields}
          />
          <FieldGroupsEditor
            title="variantFieldGroups (variant)"
            groups={variantGroups}
            setGroups={setVariantGroups}
            availableFields={availableFields}
          />
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave}>{template ? 'Update' : 'Create'}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function FieldGroupsEditor({
  title,
  groups,
  setGroups,
  availableFields,
}: {
  title: string;
  groups: ProductFieldGroup[];
  setGroups: (g: ProductFieldGroup[]) => void;
  availableFields: FieldDefinition[];
}) {
  const updateGroup = (idx: number, patch: Partial<ProductFieldGroup>) =>
    setGroups(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

  const addGroup = () => setGroups([...groups, { id: '', name: { sv: '', en: '' }, fields: [] }]);
  const removeGroup = (idx: number) => setGroups(groups.filter((_, i) => i !== idx));

  const toggleField = (idx: number, fid: string) => {
    const g = groups[idx];
    const next = g.fields.includes(fid) ? g.fields.filter((x) => x !== fid) : [...g.fields, fid];
    updateGroup(idx, { fields: next });
  };

  return (
    <div className="space-y-3 rounded-md border border-border/50 bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="w-3 h-3 mr-1" />Add group
        </Button>
      </div>
      {groups.map((g, idx) => {
        const isDefault = g.id === DEFAULT_PRODUCT_GROUP_ID;
        return (
          <div key={idx} className="space-y-3 rounded-md border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Group ID</Label>
                  <Input
                    value={g.id}
                    onChange={(e) => updateGroup(idx, { id: e.target.value })}
                    className="font-mono text-sm"
                    disabled={isDefault}
                    placeholder="PascalCase"
                  />
                </div>
                <div>
                  <Label className="text-xs">Name (SV)</Label>
                  <Input value={g.name.sv} onChange={(e) => updateGroup(idx, { name: { ...g.name, sv: e.target.value } })} />
                </div>
                <div>
                  <Label className="text-xs">Name (EN)</Label>
                  <Input value={g.name.en} onChange={(e) => updateGroup(idx, { name: { ...g.name, en: e.target.value } })} />
                </div>
              </div>
              {!isDefault && (
                <Button variant="ghost" size="icon" onClick={() => removeGroup(idx)} className="text-destructive mt-5">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {isDefault && (
              <p className="text-xs text-muted-foreground">Default group — ID is locked, name is editable.</p>
            )}
            <div>
              <Label className="text-xs font-semibold">Fields</Label>
              {availableFields.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">Create product fields first.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableFields.map((f) => {
                    const sel = g.fields.includes(f.id);
                    const usedElsewhere = groups.some((gg, i) => i !== idx && gg.fields.includes(f.id));
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={usedElsewhere && !sel}
                        onClick={() => toggleField(idx, f.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          sel ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-secondary-foreground hover:border-muted-foreground'
                        }`}
                        title={usedElsewhere && !sel ? 'Already used in another group' : undefined}
                      >
                        {f.id}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
