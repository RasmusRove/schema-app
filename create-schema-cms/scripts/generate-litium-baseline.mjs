/**
 * Converts Litium YAML definitions → JSON baseline for Schema Builder.
 * Source: D:\Projects\Test React AI_260429\litium-definitions
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = 'D:\\Projects\\Test React AI_260429\\litium-definitions';
const OUT = path.join(__dirname, '../src/data/litiumBaseline.generated.json');

function loc(name) {
  if (!name || typeof name !== 'object') return { sv: '', en: '' };
  return {
    sv: String(name['sv-SE'] ?? name.sv ?? name['en-US'] ?? name.en ?? '').trim(),
    en: String(name['en-US'] ?? name.en ?? name['sv-SE'] ?? name.sv ?? '').trim(),
  };
}

function ensureLoc(name, fallbackId) {
  const l = loc(name);
  if (!l.sv) l.sv = l.en || fallbackId;
  if (!l.en) l.en = l.sv || fallbackId;
  return l;
}

function mapType(t) {
  if (t === 'MultiField') return 'Multifield';
  return t;
}

function mapField(raw, scope) {
  const settings = raw.settings ?? {};
  const admin = settings.administration ?? {};
  const storefront = settings.storefront ?? {};
  const option = raw.option ?? {};

  const field = {
    id: raw.id,
    name: ensureLoc(raw.name, raw.id),
    type: mapType(raw.type),
    multiLanguage: !!settings.multiCulture,
    settings: {
      administration: {
        columns: !!admin.columns,
        filter: !!admin.filter,
        readonly: !!admin.readonly,
      },
      storefront: {
        visible: storefront.visible !== false,
        searchable: !!storefront.searchable,
      },
    },
    systemDefined: false,
  };

  if (['IntOption', 'TextOption', 'DecimalOption'].includes(field.type)) {
    field.options = (option.items ?? []).map((item) => ({
      value: item.value,
      label: ensureLoc(item.name, String(item.value)),
    }));
    field.multiSelect = !!option.multiSelect;
  }

  if (field.type === 'Pointer') {
    field.entityType = option.entityType;
    field.multiSelect = !!option.multiSelect;
  }

  if (field.type === 'Multifield') {
    field.fields = option.fields ?? [];
    field.isArray = option.isArray !== false;
  }

  return field;
}

function readYamlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => {
      const full = path.join(dir, f);
        return parseYaml(fs.readFileSync(full, 'utf8'), { uniqueKeys: false });
    });
}

function collectFields(dir, rootKey, scope) {
  const fields = [];
  for (const doc of readYamlFiles(dir)) {
    const list = doc?.[rootKey];
    if (!Array.isArray(list)) continue;
    for (const raw of list) fields.push(mapField(raw, scope));
  }
  return fields.sort((a, b) => a.id.localeCompare(b.id));
}

function mapFieldGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    id: g.id,
    name: ensureLoc(g.name, g.id),
    fields: (g.fields ?? []).map((f) => (typeof f === 'string' ? f : f.id)).filter(Boolean),
  }));
}

function mapContainers(containers) {
  if (!Array.isArray(containers)) return [];
  return containers.map((c) => {
    const child = c.childBlocks ?? {};
    const selections = (child.selections ?? []).map((s) => (typeof s === 'string' ? s : s.id)).filter(Boolean);
    return {
      id: c.id,
      name: ensureLoc(c.name, c.id),
      combination: child.combination ?? 'IncludeSelected',
      allowedBlocks: selections,
    };
  });
}

function collectBlockTemplates(dir) {
  const templates = [];
  for (const doc of readYamlFiles(dir)) {
    const list = doc?.blockTemplates;
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const groups = mapFieldGroups(raw.fieldGroups);
      templates.push({
        id: raw.id,
        name: ensureLoc(raw.name, raw.id),
        fields: groups.flatMap((g) => g.fields),
        fieldGroups: groups,
      });
    }
  }
  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

function collectWebsiteTemplates(dir) {
  const templates = [];
  for (const doc of readYamlFiles(dir)) {
    const list = doc?.websiteTemplates;
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const groups = mapFieldGroups(raw.fieldGroups);
      templates.push({
        id: raw.id,
        name: ensureLoc(raw.name, raw.id),
        type: raw.type === 'Website' ? 'Website' : 'Page',
        fields: groups.flatMap((g) => g.fields),
        fieldGroups: groups,
        blockContainers: mapContainers(raw.blockContainers),
      });
    }
  }
  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

function collectProductTemplates(dir) {
  const templates = [];
  for (const doc of readYamlFiles(dir)) {
    const list = doc?.productTemplates;
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const type = raw.type === 'Category' ? 'Category' : 'Product';
      const categoryGroups = mapFieldGroups(raw.categoryFieldGroups ?? raw.fieldGroups);
      const productGroups = mapFieldGroups(raw.productFieldGroups);
      const variantGroups = mapFieldGroups(raw.variantFieldGroups);
      templates.push({
        id: raw.id,
        name: ensureLoc(raw.name, raw.id),
        type,
        useVariantUrl: !!raw.useVariantUrl,
        productFieldGroups: type === 'Product' ? productGroups : [{ id: 'General', name: { sv: 'General', en: 'General' }, fields: [] }],
        variantFieldGroups: type === 'Product' ? variantGroups : [{ id: 'General', name: { sv: 'General', en: 'General' }, fields: [] }],
        fieldGroups: type === 'Category' ? categoryGroups : [{ id: 'General', name: { sv: 'General', en: 'General' }, fields: [] }],
      });
    }
  }
  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

/** System fields referenced by templates but not present as YAML field definitions */
const SYSTEM_PRODUCT_FIELDS = [
  { id: '_name', name: { sv: 'Namn', en: 'Name' }, type: 'Text', multiLanguage: true },
  { id: '_description', name: { sv: 'Beskrivning', en: 'Description' }, type: 'MultirowText', multiLanguage: true },
  { id: '_url', name: { sv: 'URL', en: 'URL' }, type: 'Text', multiLanguage: true },
  { id: '_seoTitle', name: { sv: 'SEO-titel', en: 'SEO title' }, type: 'Text', multiLanguage: true },
  { id: '_seoDescription', name: { sv: 'SEO-beskrivning', en: 'SEO description' }, type: 'MultirowText', multiLanguage: true },
].map((f) => ({
  ...f,
  systemDefined: true,
  settings: {
    administration: { columns: true, filter: true, readonly: false },
    storefront: { visible: false, searchable: false },
  },
}));

const SYSTEM_PAGE_FIELDS = [
  { id: '_name', name: { sv: 'Namn', en: 'Name' }, type: 'Text', multiLanguage: true },
  { id: '_url', name: { sv: 'URL', en: 'URL' }, type: 'Text', multiLanguage: true },
  { id: '_icon', name: { sv: 'Ikon', en: 'Icon' }, type: 'MediaPointerImage', multiLanguage: false },
  { id: '_seoTitle', name: { sv: 'SEO-titel', en: 'SEO title' }, type: 'Text', multiLanguage: true },
  { id: '_seoDescription', name: { sv: 'SEO-beskrivning', en: 'SEO description' }, type: 'MultirowText', multiLanguage: true },
  { id: '_indexThePage', name: { sv: 'Indexera sidan', en: 'Index the page' }, type: 'Boolean', multiLanguage: false },
].map((f) => ({
  ...f,
  systemDefined: true,
  settings: {
    administration: { columns: false, filter: false, readonly: false },
    storefront: { visible: false, searchable: false },
  },
}));

const SYSTEM_BLOCK_FIELDS = [
  { id: '_name', name: { sv: 'Namn', en: 'Name' }, type: 'Text', multiLanguage: true },
].map((f) => ({
  ...f,
  systemDefined: true,
  settings: {
    administration: { columns: false, filter: false, readonly: false },
    storefront: { visible: false, searchable: false },
  },
}));

function mergeFields(system, custom) {
  const byId = new Map();
  for (const f of system) byId.set(f.id, f);
  for (const f of custom) {
    if (!byId.has(f.id)) byId.set(f.id, f);
  }
  return [...byId.values()];
}

const blockFields = mergeFields(
  SYSTEM_BLOCK_FIELDS,
  collectFields(path.join(SOURCE, 'blocks/fields'), 'blockFields', 'block'),
);
const pageFields = mergeFields(
  SYSTEM_PAGE_FIELDS,
  collectFields(path.join(SOURCE, 'websites/fields'), 'websiteFields', 'page'),
);
const productFields = mergeFields(
  SYSTEM_PRODUCT_FIELDS,
  collectFields(path.join(SOURCE, 'products/fields'), 'productFields', 'product'),
);

const baseline = {
  source: SOURCE,
  generatedAt: new Date().toISOString(),
  blockFields,
  pageFields,
  productFields,
  blockTemplates: collectBlockTemplates(path.join(SOURCE, 'blocks/fieldTemplates')),
  pageTemplates: collectWebsiteTemplates(path.join(SOURCE, 'websites/fieldTemplates')),
  productTemplates: collectProductTemplates(path.join(SOURCE, 'products/fieldTemplates')),
};

fs.writeFileSync(OUT, JSON.stringify(baseline, null, 2), 'utf8');
console.log('Wrote', OUT);
console.log({
  blockFields: baseline.blockFields.length,
  pageFields: baseline.pageFields.length,
  productFields: baseline.productFields.length,
  blockTemplates: baseline.blockTemplates.length,
  pageTemplates: baseline.pageTemplates.length,
  productTemplates: baseline.productTemplates.length,
});
