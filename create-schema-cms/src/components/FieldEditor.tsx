import { useState, useCallback, useMemo } from 'react';
import type { FieldDefinition, FieldType, OptionItem, EntityType, FieldSettings } from '@/types/schema';
import {
  FIELD_TYPES,
  ENTITY_TYPES,
  defaultFieldSettingsFor,
  isOptionFieldType,
} from '@/types/schema';
import { useSchemaStore } from '@/store/schemaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface FieldEditorProps {
  field?: FieldDefinition;
  scope: 'block' | 'page' | 'product';
  onSave: (f: FieldDefinition) => void;
  onCancel: () => void;
}

function NativeSelect({ value, onChange, options, className = '' }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CheckboxRow({ id, checked, onChange, label }: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        id={id}
        className="h-4 w-4 rounded border-input accent-primary"
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

export function FieldEditor({ field, scope, onSave, onCancel }: FieldEditorProps) {
  const blockFields = useSchemaStore((s) => s.blockFields);
  const pageFields = useSchemaStore((s) => s.pageFields);
  const productFields = useSchemaStore((s) => s.productFields);
  const blockTemplates = useSchemaStore((s) => s.blockTemplates);
  const pageTemplates = useSchemaStore((s) => s.pageTemplates);
  const productTemplates = useSchemaStore((s) => s.productTemplates);

  const scopeFields =
    scope === 'block' ? blockFields
    : scope === 'page' ? pageFields
    : productFields;

  const existingIds = useMemo(() => [
    ...scopeFields.map((f) => f.id),
    ...blockTemplates.map((t) => t.id),
    ...pageTemplates.map((t) => t.id),
    ...productTemplates.map((t) => t.id),
    ...pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
  ], [scopeFields, blockTemplates, pageTemplates, productTemplates]);

  const [id, setId] = useState(field?.id ?? '');
  const [nameSv, setNameSv] = useState(field?.name.sv ?? '');
  const [nameEn, setNameEn] = useState(field?.name.en ?? '');
  const [type, setType] = useState<FieldType>(field?.type ?? 'Text');
  const [multiLanguage, setMultiLanguage] = useState(field?.multiLanguage ?? false);
  const [options, setOptions] = useState<OptionItem[]>(field?.options ?? []);
  const [entityType, setEntityType] = useState<EntityType>(field?.entityType ?? 'WebsitesPage');
  const [multiSelect, setMultiSelect] = useState(field?.multiSelect ?? false);
  const [multifieldIds, setMultifieldIds] = useState<string[]>(field?.fields ?? []);
  const [isArray, setIsArray] = useState(field?.isArray ?? true);
  const scopeDefaults = defaultFieldSettingsFor(scope);
  const [settings, setSettings] = useState<FieldSettings>({
    administration: {
      ...scopeDefaults.administration,
      ...field?.settings?.administration,
    },
    storefront: {
      ...scopeDefaults.storefront,
      ...field?.settings?.storefront,
    },
  });
  const [errors, setErrors] = useState<string[]>([]);

  const validate = useCallback(() => {
    const errs: string[] = [];
    const trimmedId = id.trim();
    if (!trimmedId) errs.push('ID is required');
    else if (!/^[A-Z_][A-Za-z0-9_]*$/.test(trimmedId))
      errs.push('ID must start with uppercase letter or underscore, then letters/numbers/underscores only');
    if (trimmedId !== field?.id && existingIds.includes(trimmedId)) errs.push('ID already exists');
    if (!nameSv.trim()) errs.push('Swedish name is required');
    if (!nameEn.trim()) errs.push('English name is required');
    if (isOptionFieldType(type) && options.length === 0)
      errs.push('At least one option is required');
    if (type === 'Multifield' && multifieldIds.length === 0)
      errs.push('Select at least one nested field');
    return errs;
  }, [id, nameSv, nameEn, type, options, field, existingIds, multifieldIds]);

  const handleSave = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    const result: FieldDefinition = {
      id: id.trim(),
      name: { sv: nameSv.trim(), en: nameEn.trim() },
      type,
      multiLanguage,
      settings,
    };

    if (isOptionFieldType(type)) {
      result.options = options;
      result.multiSelect = multiSelect;
    }
    if (type === 'Pointer') {
      result.entityType = entityType;
      result.multiSelect = multiSelect;
    }
    if (type === 'Multifield') {
      result.fields = multifieldIds;
      result.isArray = isArray;
    }

    onSave(result);
  };

  const addOption = () => setOptions([...options, { value: '', label: { sv: '', en: '' } }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, patch: Partial<OptionItem>) => {
    setOptions(options.map((o, idx) => idx === i ? { ...o, ...patch } as OptionItem : o));
  };

  const parseOptionValue = (raw: string): string | number => {
    if (type === 'IntOption') return Number(raw) || 0;
    if (type === 'DecimalOption') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    return raw;
  };

  const availableForMultifield = scopeFields.filter((f) => f.id !== id && f.type !== 'Multifield');

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      {errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>ID</Label>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. HeroImage"
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label>Name (SV)</Label>
          <Input value={nameSv} onChange={(e) => setNameSv(e.target.value)} placeholder="Swedish name" />
        </div>
        <div>
          <Label>Name (EN)</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="English name" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <NativeSelect
            value={type}
            onChange={(v) => setType(v as FieldType)}
            options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="flex items-end pb-1">
          <CheckboxRow id="multilang" checked={multiLanguage} onChange={setMultiLanguage} label="Multi-language" />
        </div>
      </div>

      {/* Field settings (Litium administration / storefront) */}
      <div className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-3">
        <Label className="text-sm font-semibold">Settings</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Administration</p>
            <CheckboxRow
              id="admin-columns"
              checked={settings.administration.columns}
              onChange={(v) => setSettings({ ...settings, administration: { ...settings.administration, columns: v } })}
              label="Columns"
            />
            <CheckboxRow
              id="admin-filter"
              checked={settings.administration.filter}
              onChange={(v) => setSettings({ ...settings, administration: { ...settings.administration, filter: v } })}
              label="Filter"
            />
            <CheckboxRow
              id="admin-readonly"
              checked={settings.administration.readonly}
              onChange={(v) => setSettings({ ...settings, administration: { ...settings.administration, readonly: v } })}
              label="Readonly"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Storefront</p>
            <CheckboxRow
              id="sf-visible"
              checked={settings.storefront.visible}
              onChange={(v) => setSettings({ ...settings, storefront: { ...settings.storefront, visible: v } })}
              label="Visible"
            />
            <CheckboxRow
              id="sf-searchable"
              checked={settings.storefront.searchable}
              onChange={(v) => setSettings({ ...settings, storefront: { ...settings.storefront, searchable: v } })}
              label="Searchable"
            />
          </div>
        </div>
      </div>

      {/* Option fields */}
      {isOptionFieldType(type) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Options</Label>
            <div className="flex items-center gap-4">
              <CheckboxRow id="option-multiselect" checked={multiSelect} onChange={setMultiSelect} label="Multi-select" />
              <Button variant="outline" size="sm" onClick={addOption}><Plus className="w-3 h-3 mr-1" />Add</Button>
            </div>
          </div>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                placeholder="Value"
                value={String(opt.value)}
                onChange={(e) => updateOption(i, { value: parseOptionValue(e.target.value) })}
                className="w-28 font-mono text-sm"
              />
              <Input placeholder="Label SV" value={opt.label.sv} onChange={(e) => updateOption(i, { label: { ...opt.label, sv: e.target.value } })} />
              <Input placeholder="Label EN" value={opt.label.en} onChange={(e) => updateOption(i, { label: { ...opt.label, en: e.target.value } })} />
              <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="text-destructive shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pointer */}
      {type === 'Pointer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Entity Type</Label>
            <NativeSelect
              value={entityType}
              onChange={(v) => setEntityType(v as EntityType)}
              options={ENTITY_TYPES.map((e) => ({ value: e, label: e }))}
            />
          </div>
          <div className="flex items-end pb-1">
            <CheckboxRow id="pointer-multiselect" checked={multiSelect} onChange={setMultiSelect} label="Multi-select" />
          </div>
        </div>
      )}

      {/* Multifield */}
      {type === 'Multifield' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Nested Fields (select existing)</Label>
            <CheckboxRow id="multifield-array" checked={isArray} onChange={setIsArray} label="Is array" />
          </div>
          {availableForMultifield.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields available. Create fields first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableForMultifield.map((f) => {
                const selected = multifieldIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMultifieldIds(selected ? multifieldIds.filter((x) => x !== f.id) : [...multifieldIds, f.id])}
                    className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${
                      selected
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-secondary border-border text-secondary-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {f.id}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave}>{field ? 'Update' : 'Create'} Field</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
