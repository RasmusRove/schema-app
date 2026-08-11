import type {
  FieldDefinition,
  BlockTemplate,
  PageTemplate,
  ProductTemplate,
} from '@/types/schema';
import {
  withFieldDefaults,
  withDefaults,
  withProductDefaults,
} from '@/types/schema';
import generated from './litiumBaseline.generated.json';

/**
 * Baseline from real Litium definitions:
 * D:\Projects\Test React AI_260429\litium-definitions
 * Regenerate: node scripts/generate-litium-baseline.mjs
 */

function asFields(list: FieldDefinition[], scope: 'block' | 'page' | 'product'): FieldDefinition[] {
  return list.map((f) => withFieldDefaults(f as FieldDefinition, scope));
}

export const LITIUM_SYSTEM_BLOCK_FIELDS = asFields(
  (generated.blockFields as FieldDefinition[]).filter((f) => f.systemDefined),
  'block',
);
export const LITIUM_SYSTEM_PAGE_FIELDS = asFields(
  (generated.pageFields as FieldDefinition[]).filter((f) => f.systemDefined),
  'page',
);
export const LITIUM_SYSTEM_PRODUCT_FIELDS = asFields(
  (generated.productFields as FieldDefinition[]).filter((f) => f.systemDefined),
  'product',
);

export const ACCELERATOR_BLOCK_FIELDS = asFields(
  (generated.blockFields as FieldDefinition[]).filter((f) => !f.systemDefined),
  'block',
);
export const ACCELERATOR_PAGE_FIELDS = asFields(
  (generated.pageFields as FieldDefinition[]).filter((f) => !f.systemDefined),
  'page',
);
export const ACCELERATOR_PRODUCT_FIELDS = asFields(
  (generated.productFields as FieldDefinition[]).filter((f) => !f.systemDefined),
  'product',
);

export const STARTER_BLOCK_TEMPLATES: BlockTemplate[] = (
  generated.blockTemplates as BlockTemplate[]
).map((t) => withDefaults(t));

export const STARTER_PAGE_TEMPLATES: PageTemplate[] = (
  generated.pageTemplates as PageTemplate[]
).map((t) => withDefaults(t));

export const STARTER_PRODUCT_TEMPLATES: ProductTemplate[] = (
  generated.productTemplates as ProductTemplate[]
).map((t) => withProductDefaults(t));

export function mergeSystemFields(
  existing: FieldDefinition[],
  system: FieldDefinition[],
): { fields: FieldDefinition[]; added: number } {
  const byId = new Map(existing.map((f) => [f.id, f]));
  let added = 0;
  for (const sf of system) {
    const cur = byId.get(sf.id);
    if (!cur) {
      byId.set(sf.id, sf);
      added += 1;
    } else if (sf.systemDefined) {
      byId.set(sf.id, {
        ...cur,
        systemDefined: true,
        type: sf.type,
        entityType: sf.entityType ?? cur.entityType,
        multiSelect: sf.multiSelect ?? cur.multiSelect,
      });
    }
  }
  const preferredIds = system.map((s) => s.id);
  const preferred = preferredIds.map((id) => byId.get(id)!).filter(Boolean);
  const rest = existing.filter((f) => !preferredIds.includes(f.id));
  return { fields: [...preferred, ...rest], added };
}

function mergeById<T extends { id: string }>(
  existing: T[],
  baseline: T[],
): { items: T[]; added: number } {
  const have = new Set(existing.map((x) => x.id));
  const missing = baseline.filter((x) => !have.has(x.id));
  return { items: [...existing, ...missing], added: missing.length };
}

export interface SystemSyncResult {
  productFieldsAdded: number;
  pageFieldsAdded: number;
  blockFieldsAdded: number;
  productTemplatesAdded: number;
  pageTemplatesAdded: number;
  blockTemplatesAdded: number;
  templatesSeeded: boolean;
}

export function applySystemBaseline(state: {
  blockFields: FieldDefinition[];
  pageFields: FieldDefinition[];
  productFields: FieldDefinition[];
  blockTemplates: BlockTemplate[];
  pageTemplates: PageTemplate[];
  productTemplates: ProductTemplate[];
  seedTemplatesIfEmpty?: boolean;
}): {
  blockFields: FieldDefinition[];
  pageFields: FieldDefinition[];
  productFields: FieldDefinition[];
  blockTemplates: BlockTemplate[];
  pageTemplates: PageTemplate[];
  productTemplates: ProductTemplate[];
  result: SystemSyncResult;
} {
  const allBlockFields = [...LITIUM_SYSTEM_BLOCK_FIELDS, ...ACCELERATOR_BLOCK_FIELDS];
  const allPageFields = [...LITIUM_SYSTEM_PAGE_FIELDS, ...ACCELERATOR_PAGE_FIELDS];
  const allProductFields = [...LITIUM_SYSTEM_PRODUCT_FIELDS, ...ACCELERATOR_PRODUCT_FIELDS];

  const product = mergeSystemFields(state.productFields, allProductFields);
  const page = mergeSystemFields(state.pageFields, allPageFields);
  const block = mergeSystemFields(state.blockFields, allBlockFields);

  const productTpl = mergeById(state.productTemplates, STARTER_PRODUCT_TEMPLATES);
  const pageTpl = mergeById(state.pageTemplates.map(withDefaults), STARTER_PAGE_TEMPLATES);
  const blockTpl = mergeById(state.blockTemplates.map(withDefaults), STARTER_BLOCK_TEMPLATES);

  const templatesSeeded =
    productTpl.added + pageTpl.added + blockTpl.added > 0;

  return {
    productFields: product.fields,
    pageFields: page.fields,
    blockFields: block.fields,
    productTemplates: productTpl.items.map(withProductDefaults),
    pageTemplates: pageTpl.items.map(withDefaults),
    blockTemplates: blockTpl.items.map(withDefaults),
    result: {
      productFieldsAdded: product.added,
      pageFieldsAdded: page.added,
      blockFieldsAdded: block.added,
      productTemplatesAdded: productTpl.added,
      pageTemplatesAdded: pageTpl.added,
      blockTemplatesAdded: blockTpl.added,
      templatesSeeded,
    },
  };
}
