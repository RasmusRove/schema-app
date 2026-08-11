import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FieldDefinition,
  BlockTemplate,
  PageTemplate,
  ProductTemplate,
  SchemaExport,
  ValidationResult,
} from '@/types/schema';
import {
  DEFAULT_FIELD_GROUP,
  validateSchema,
  withDefaults,
  withProductDefaults,
  withFieldDefaults,
} from '@/types/schema';
import { applySystemBaseline, type SystemSyncResult } from '@/data/litiumSystemFields';

interface SchemaState {
  blockFields: FieldDefinition[];
  blockTemplates: BlockTemplate[];
  pageFields: FieldDefinition[];
  pageTemplates: PageTemplate[];
  productFields: FieldDefinition[];
  productTemplates: ProductTemplate[];
  systemBaselineVersion: number;

  addBlockField: (f: FieldDefinition) => void;
  updateBlockField: (id: string, f: FieldDefinition) => void;
  deleteBlockField: (id: string) => void;

  addPageField: (f: FieldDefinition) => void;
  updatePageField: (id: string, f: FieldDefinition) => void;
  deletePageField: (id: string) => void;

  addProductField: (f: FieldDefinition) => void;
  updateProductField: (id: string, f: FieldDefinition) => void;
  deleteProductField: (id: string) => void;

  addBlockTemplate: (t: BlockTemplate) => void;
  updateBlockTemplate: (id: string, t: BlockTemplate) => void;
  deleteBlockTemplate: (id: string) => void;

  addPageTemplate: (t: PageTemplate) => void;
  updatePageTemplate: (id: string, t: PageTemplate) => void;
  deletePageTemplate: (id: string) => void;

  addProductTemplate: (t: ProductTemplate) => void;
  updateProductTemplate: (id: string, t: ProductTemplate) => void;
  deleteProductTemplate: (id: string) => void;

  syncSystemBaseline: (opts?: { seedTemplatesIfEmpty?: boolean }) => SystemSyncResult;

  exportJSON: () => SchemaExport;
  importJSON: (data: SchemaExport) => void;
  validate: () => ValidationResult;

  getAllIds: () => string[];
}

/** Bump when Litium system field set changes so rehydrate re-syncs missing fields */
export const SYSTEM_BASELINE_VERSION = 3;

const stripFieldFromProductGroups = (t: ProductTemplate, fid: string): ProductTemplate => ({
  ...t,
  productFieldGroups: t.productFieldGroups.map((g) => ({ ...g, fields: g.fields.filter((x) => x !== fid) })),
  variantFieldGroups: t.variantFieldGroups.map((g) => ({ ...g, fields: g.fields.filter((x) => x !== fid) })),
  fieldGroups: (t.fieldGroups ?? []).map((g) => ({ ...g, fields: g.fields.filter((x) => x !== fid) })),
});

const initialBaseline = applySystemBaseline({
  blockFields: [],
  pageFields: [],
  productFields: [],
  blockTemplates: [],
  pageTemplates: [],
  productTemplates: [],
  seedTemplatesIfEmpty: true,
});

export const useSchemaStore = create<SchemaState>()(
  persist(
    (set, get) => ({
      blockFields: initialBaseline.blockFields,
      blockTemplates: initialBaseline.blockTemplates,
      pageFields: initialBaseline.pageFields,
      pageTemplates: initialBaseline.pageTemplates,
      productFields: initialBaseline.productFields,
      productTemplates: initialBaseline.productTemplates,
      systemBaselineVersion: SYSTEM_BASELINE_VERSION,

      addBlockField: (f) => set((s) => ({ blockFields: [...s.blockFields, withFieldDefaults(f)] })),
      updateBlockField: (id, f) => set((s) => {
        const existing = s.blockFields.find((x) => x.id === id);
        const rename = (fid: string) => (fid === id ? f.id : fid);
        const next = withFieldDefaults({
          ...f,
          id: existing?.systemDefined ? id : f.id,
          type: existing?.systemDefined ? existing.type : f.type,
          systemDefined: existing?.systemDefined || f.systemDefined,
        });
        return {
          blockFields: s.blockFields.map((x) => (x.id === id ? next : { ...x, fields: x.fields?.map(rename) })),
          blockTemplates: id === next.id ? s.blockTemplates : s.blockTemplates.map((t) => ({ ...t, fields: t.fields.map(rename) })),
        };
      }),
      deleteBlockField: (id) => set((s) => {
        const field = s.blockFields.find((x) => x.id === id);
        if (field?.systemDefined) return s;
        return {
          blockFields: s.blockFields.filter((x) => x.id !== id).map((x) => ({ ...x, fields: x.fields?.filter((fid) => fid !== id) })),
          blockTemplates: s.blockTemplates.map((t) => ({ ...t, fields: t.fields.filter((fid) => fid !== id) })),
        };
      }),

      addPageField: (f) => set((s) => ({ pageFields: [...s.pageFields, withFieldDefaults(f)] })),
      updatePageField: (id, f) => set((s) => {
        const existing = s.pageFields.find((x) => x.id === id);
        const rename = (fid: string) => (fid === id ? f.id : fid);
        const next = withFieldDefaults({
          ...f,
          id: existing?.systemDefined ? id : f.id,
          type: existing?.systemDefined ? existing.type : f.type,
          systemDefined: existing?.systemDefined || f.systemDefined,
        });
        return {
          pageFields: s.pageFields.map((x) => (x.id === id ? next : { ...x, fields: x.fields?.map(rename) })),
          pageTemplates: id === next.id ? s.pageTemplates : s.pageTemplates.map((t) => ({ ...t, fields: t.fields.map(rename) })),
        };
      }),
      deletePageField: (id) => set((s) => {
        const field = s.pageFields.find((x) => x.id === id);
        if (field?.systemDefined) return s;
        return {
          pageFields: s.pageFields.filter((x) => x.id !== id).map((x) => ({ ...x, fields: x.fields?.filter((fid) => fid !== id) })),
          pageTemplates: s.pageTemplates.map((t) => ({ ...t, fields: t.fields.filter((fid) => fid !== id) })),
        };
      }),

      addProductField: (f) => set((s) => ({ productFields: [...s.productFields, withFieldDefaults(f, 'product')] })),
      updateProductField: (id, f) => set((s) => {
        const existing = s.productFields.find((x) => x.id === id);
        const rename = (fid: string) => (fid === id ? f.id : fid);
        const next = withFieldDefaults({
          ...f,
          id: existing?.systemDefined ? id : f.id,
          type: existing?.systemDefined ? existing.type : f.type,
          systemDefined: existing?.systemDefined || f.systemDefined,
        }, 'product');
        const renameGroups = (groups: ProductFieldGroupLike) =>
          groups.map((g) => ({ ...g, fields: g.fields.map(rename) }));
        return {
          productFields: s.productFields.map((x) => (x.id === id ? next : { ...x, fields: x.fields?.map(rename) })),
          productTemplates: id === next.id ? s.productTemplates : s.productTemplates.map((t) => ({
            ...t,
            productFieldGroups: renameGroups(t.productFieldGroups),
            variantFieldGroups: renameGroups(t.variantFieldGroups),
            fieldGroups: renameGroups(t.fieldGroups ?? []),
          })),
        };
      }),
      deleteProductField: (id) => set((s) => {
        const field = s.productFields.find((x) => x.id === id);
        if (field?.systemDefined) return s;
        return {
          productFields: s.productFields.filter((x) => x.id !== id),
          productTemplates: s.productTemplates.map((t) => stripFieldFromProductGroups(t, id)),
        };
      }),

      addBlockTemplate: (t) => set((s) => ({ blockTemplates: [...s.blockTemplates, withDefaults(t)] })),
      updateBlockTemplate: (id, t) => set((s) => ({
        blockTemplates: s.blockTemplates.map((x) => (x.id === id ? withDefaults(t) : x)),
      })),
      deleteBlockTemplate: (id) => set((s) => ({
        blockTemplates: s.blockTemplates.filter((x) => x.id !== id),
        pageTemplates: s.pageTemplates.map((pt) => ({
          ...pt,
          blockContainers: pt.blockContainers.map((bc) => ({
            ...bc,
            allowedBlocks: bc.allowedBlocks.filter((bid) => bid !== id),
          })),
        })),
      })),

      addPageTemplate: (t) => set((s) => ({ pageTemplates: [...s.pageTemplates, withDefaults(t)] })),
      updatePageTemplate: (id, t) => set((s) => ({
        pageTemplates: s.pageTemplates.map((x) => (x.id === id ? withDefaults(t) : x)),
      })),
      deletePageTemplate: (id) => set((s) => ({ pageTemplates: s.pageTemplates.filter((x) => x.id !== id) })),

      addProductTemplate: (t) => set((s) => ({ productTemplates: [...s.productTemplates, withProductDefaults(t)] })),
      updateProductTemplate: (id, t) => set((s) => ({
        productTemplates: s.productTemplates.map((x) => (x.id === id ? withProductDefaults(t) : x)),
      })),
      deleteProductTemplate: (id) => set((s) => ({ productTemplates: s.productTemplates.filter((x) => x.id !== id) })),

      syncSystemBaseline: (opts) => {
        const s = get();
        const next = applySystemBaseline({
          blockFields: s.blockFields,
          pageFields: s.pageFields,
          productFields: s.productFields,
          blockTemplates: s.blockTemplates,
          pageTemplates: s.pageTemplates,
          productTemplates: s.productTemplates,
          seedTemplatesIfEmpty: opts?.seedTemplatesIfEmpty ?? false,
        });
        set({
          blockFields: next.blockFields,
          pageFields: next.pageFields,
          productFields: next.productFields,
          blockTemplates: next.blockTemplates,
          pageTemplates: next.pageTemplates,
          productTemplates: next.productTemplates,
          systemBaselineVersion: SYSTEM_BASELINE_VERSION,
        });
        return next.result;
      },

      exportJSON: () => {
        const { blockFields, blockTemplates, pageFields, pageTemplates, productFields, productTemplates } = get();
        return {
          blockFields: blockFields.map(withFieldDefaults),
          blockTemplates: blockTemplates.map(withDefaults),
          pageFields: pageFields.map(withFieldDefaults),
          pageTemplates: pageTemplates.map(withDefaults),
          productFields: productFields.map((f) => withFieldDefaults(f, 'product')),
          productTemplates: productTemplates.map(withProductDefaults),
        };
      },

      importJSON: (data) => {
        set({
          blockFields: (data.blockFields ?? []).map(withFieldDefaults),
          blockTemplates: (data.blockTemplates ?? []).map(withDefaults),
          pageFields: (data.pageFields ?? []).map(withFieldDefaults),
          pageTemplates: (data.pageTemplates ?? []).map((pt) => ({
            ...withDefaults(pt),
            blockContainers: pt.blockContainers ?? [],
          })),
          productFields: (data.productFields ?? []).map((f) => withFieldDefaults(f, 'product')),
          productTemplates: (data.productTemplates ?? []).map(withProductDefaults),
        });
      },

      validate: () => {
        const { blockFields, blockTemplates, pageFields, pageTemplates, productFields, productTemplates } = get();
        return validateSchema({
          blockFields, blockTemplates, pageFields, pageTemplates, productFields, productTemplates,
        });
      },

      getAllIds: () => {
        const s = get();
        return [
          ...s.blockFields.map((f) => f.id),
          ...s.pageFields.map((f) => f.id),
          ...s.productFields.map((f) => f.id),
          ...s.blockTemplates.map((t) => t.id),
          ...s.pageTemplates.map((t) => t.id),
          ...s.productTemplates.map((t) => t.id),
          ...s.pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
          ...s.productTemplates.flatMap((pt) => [
            ...pt.productFieldGroups.map((g) => g.id),
            ...pt.variantFieldGroups.map((g) => g.id),
            ...(pt.fieldGroups ?? []).map((g) => g.id),
          ]),
        ];
      },
    }),
    {
      name: 'litium-schema-store',
      version: SYSTEM_BASELINE_VERSION,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<SchemaState>;
        const next = applySystemBaseline({
          blockFields: state.blockFields ?? [],
          pageFields: state.pageFields ?? [],
          productFields: state.productFields ?? [],
          blockTemplates: state.blockTemplates ?? [],
          pageTemplates: state.pageTemplates ?? [],
          productTemplates: state.productTemplates ?? [],
          seedTemplatesIfEmpty: true,
        });
        return {
          ...state,
          ...next,
          systemBaselineVersion: SYSTEM_BASELINE_VERSION,
        };
      },
    }
  )
);

type ProductFieldGroupLike = { id: string; name: { sv: string; en: string }; fields: string[] }[];

export { DEFAULT_FIELD_GROUP };
