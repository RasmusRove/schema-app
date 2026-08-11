export const FIELD_TYPES = [
  'Boolean',
  'Date',
  'DateTime',
  'Decimal',
  'DecimalOption',
  'Editor',
  'Int',
  'IntOption',
  'LimitedText',
  'Link',
  'Long',
  'MediaPointerFile',
  'MediaPointerImage',
  'Multifield',
  'MultirowText',
  'Pointer',
  'Text',
  'TextOption',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** Litium PointerTypeConstants used in definitions / Storefront YAML */
export const ENTITY_TYPES = [
  'CustomersGroup',
  'CustomersOrganization',
  'CustomersPerson',
  'CustomersTargetGroup',
  'GlobalizationCountry',
  'MediaFile',
  'MediaImage',
  'MediaVideo',
  'ProductsAssortment',
  'ProductsCategory',
  'ProductsProduct',
  'ProductsProductField',
  'ProductsProductList',
  'WebsitesPage',
  'WebsitesWebsite',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const BLOCK_COMBINATIONS = ['All', 'IncludeSelected', 'ExcludeSelected'] as const;
export type BlockCombination = (typeof BLOCK_COMBINATIONS)[number];

export const OPTION_FIELD_TYPES = ['IntOption', 'TextOption', 'DecimalOption'] as const;
export type OptionFieldType = (typeof OPTION_FIELD_TYPES)[number];

export function isOptionFieldType(type: FieldType): type is OptionFieldType {
  return (OPTION_FIELD_TYPES as readonly string[]).includes(type);
}

export interface LocalizedString {
  sv: string;
  en: string;
}

export interface OptionItem {
  value: string | number;
  label: LocalizedString;
}

export interface FieldGroup {
  id: string;
  name: string;
}

export const DEFAULT_FIELD_GROUP: FieldGroup = { id: 'content', name: 'content' };

export interface FieldAdministrationSettings {
  columns: boolean;
  filter: boolean;
  readonly: boolean;
}

export interface FieldStorefrontSettings {
  visible: boolean;
  searchable: boolean;
}

export interface FieldSettings {
  administration: FieldAdministrationSettings;
  storefront: FieldStorefrontSettings;
}

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  administration: { columns: false, filter: false, readonly: false },
  storefront: { visible: true, searchable: false },
};

/** Product area fields: columns + filter on by default (Litium BO lists) */
export const DEFAULT_PRODUCT_FIELD_SETTINGS: FieldSettings = {
  administration: { columns: true, filter: true, readonly: false },
  storefront: { visible: true, searchable: false },
};

export function defaultFieldSettingsFor(scope: 'block' | 'page' | 'product'): FieldSettings {
  return scope === 'product' ? DEFAULT_PRODUCT_FIELD_SETTINGS : DEFAULT_FIELD_SETTINGS;
}

export interface FieldDefinition {
  id: string;
  name: LocalizedString;
  type: FieldType;
  multiLanguage: boolean;
  options?: OptionItem[];
  entityType?: EntityType;
  multiSelect?: boolean;
  fields?: string[];
  /** Multifield: store as array of item sets (Litium IsArray) */
  isArray?: boolean;
  settings?: FieldSettings;
}

export interface BlockTemplate {
  id: string;
  name: LocalizedString;
  fields: string[];
  fieldGroup?: FieldGroup;
}

export interface BlockContainer {
  id: string;
  name?: LocalizedString;
  /** Litium childBlocks.combination */
  combination?: BlockCombination;
  allowedBlocks: string[];
}

export interface PageTemplate {
  id: string;
  name: LocalizedString;
  fields: string[];
  blockContainers: BlockContainer[];
  fieldGroup?: FieldGroup;
}

// ----- Product / Category types (same product area + productFields) -----
export const PRODUCT_TEMPLATE_TYPES = ['Product', 'Category'] as const;
export type ProductTemplateType = (typeof PRODUCT_TEMPLATE_TYPES)[number];

export interface ProductFieldGroup {
  id: string;
  name: LocalizedString;
  fields: string[]; // Product Field IDs
}

export interface ProductTemplate {
  id: string;
  name: LocalizedString;
  /** Litium product area template: Product or Category */
  type: ProductTemplateType;
  /** Used when type = Product */
  productFieldGroups: ProductFieldGroup[];
  /** Used when type = Product */
  variantFieldGroups: ProductFieldGroup[];
  /** Used when type = Category (same productFields pool) */
  fieldGroups: ProductFieldGroup[];
  useVariantUrl?: boolean;
}

export const DEFAULT_PRODUCT_GROUP_ID = 'General';

export function makeDefaultProductGroup(): ProductFieldGroup {
  return { id: DEFAULT_PRODUCT_GROUP_ID, name: { sv: 'General', en: 'General' }, fields: [] };
}

export interface SchemaMeta {
  instruction: string;
  litiumMapping: {
    fieldTypeToYaml: Record<string, string>;
    pointerEntityTypes: Record<string, string>;
    localeToYaml: Record<string, string>;
  };
  conventions: {
    fileNames: string;
    yamlIds: string;
    fragmentNames: string;
    componentSuffix: string;
    pagePlacement: string;
    fragmentLocation: string;
  };
  defaults: {
    fieldGroup: FieldGroup;
    blockContainerNaming: string;
    productDefaultGroupId: string;
    fieldSettings: FieldSettings;
  };
  rules: {
    noHtmlRendering: boolean;
    logPropsOnly: boolean;
    createOrUpdateOnly: boolean;
    noDelete: boolean;
    syncAllRelatedFilesOnChange: boolean;
    reuseExistingInterfaces: boolean;
  };
}

export interface SchemaExport {
  meta?: SchemaMeta;
  blockFields: FieldDefinition[];
  blockTemplates: BlockTemplate[];
  pageFields: FieldDefinition[];
  pageTemplates: PageTemplate[];
  productFields: FieldDefinition[];
  productTemplates: ProductTemplate[];
}

export const SCHEMA_META: SchemaMeta = {
  instruction:
    'Before generating any files, always review system-prompt.md. This is the only prompt to follow. Do not use any other prompting. If required information is missing, ask instead of making assumptions. Do not generate HTML.',
  litiumMapping: {
    fieldTypeToYaml: {
      Boolean: 'Boolean',
      Date: 'Date',
      DateTime: 'DateTime',
      Decimal: 'Decimal',
      DecimalOption: 'DecimalOption',
      Editor: 'Editor',
      Int: 'Int',
      IntOption: 'IntOption',
      LimitedText: 'LimitedText',
      Link: 'Link',
      Long: 'Long',
      MediaPointerImage: 'MediaPointerImage',
      MediaPointerFile: 'MediaPointerFile',
      Multifield: 'MultiField',
      MultirowText: 'MultirowText',
      Pointer: 'Pointer',
      Text: 'Text',
      TextOption: 'TextOption',
    },
    pointerEntityTypes: Object.fromEntries(ENTITY_TYPES.map((e) => [e, e])),
    localeToYaml: {
      sv: 'sv-SE',
      en: 'en-US',
    },
  },
  conventions: {
    fileNames: 'PascalCase',
    yamlIds: 'PascalCase',
    fragmentNames: 'camelCase',
    componentSuffix: 'Block',
    pagePlacement: 'app/stickyHeader',
    fragmentLocation: 'operations/fragments/blocks',
  },
  defaults: {
    fieldGroup: DEFAULT_FIELD_GROUP,
    blockContainerNaming: 'PascalCase',
    productDefaultGroupId: DEFAULT_PRODUCT_GROUP_ID,
    fieldSettings: DEFAULT_FIELD_SETTINGS,
  },
  rules: {
    noHtmlRendering: true,
    logPropsOnly: true,
    createOrUpdateOnly: true,
    noDelete: true,
    syncAllRelatedFilesOnChange: true,
    reuseExistingInterfaces: true,
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const PASCAL_RE = /^[A-Z_][A-Za-z0-9_]*$/;

export function withFieldDefaults(
  f: FieldDefinition,
  scope: 'block' | 'page' | 'product' = 'block',
): FieldDefinition {
  const defaults = defaultFieldSettingsFor(scope);
  return {
    ...f,
    settings: {
      administration: {
        ...defaults.administration,
        ...f.settings?.administration,
      },
      storefront: {
        ...defaults.storefront,
        ...f.settings?.storefront,
      },
    },
  };
}

export function withContainerDefaults(bc: BlockContainer): BlockContainer {
  return {
    ...bc,
    name: bc.name ?? { sv: bc.id, en: bc.id },
    combination: bc.combination ?? 'IncludeSelected',
    allowedBlocks: bc.allowedBlocks ?? [],
  };
}

export function validateSchema(data: {
  blockFields: FieldDefinition[];
  pageFields: FieldDefinition[];
  blockTemplates: BlockTemplate[];
  pageTemplates: PageTemplate[];
  productFields: FieldDefinition[];
  productTemplates: ProductTemplate[];
}): ValidationResult {
  const errors: string[] = [];
  const {
    blockFields,
    pageFields,
    blockTemplates,
    pageTemplates,
    productFields,
    productTemplates,
  } = data;

  const blockFieldIds = new Set(blockFields.map((f) => f.id));
  const pageFieldIds = new Set(pageFields.map((f) => f.id));
  const productFieldIds = new Set(productFields.map((f) => f.id));
  const blockTemplateIds = new Set(blockTemplates.map((t) => t.id));

  const checkDuplicates = (ids: string[], scope: string) => {
    const seen = new Map<string, number>();
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
    for (const [id, count] of seen) if (count > 1) errors.push(`Duplicate ID "${id}" in ${scope} (found ${count} times)`);
  };
  checkDuplicates(blockFields.map((f) => f.id), 'block fields');
  checkDuplicates(pageFields.map((f) => f.id), 'page fields');
  checkDuplicates(productFields.map((f) => f.id), 'product fields');
  checkDuplicates(
    [
      ...blockTemplates.map((t) => t.id),
      ...pageTemplates.map((t) => t.id),
      ...productTemplates.map((t) => t.id),
      ...pageTemplates.flatMap((pt) => pt.blockContainers.map((bc) => bc.id)),
    ],
    'templates/containers',
  );

  const checkPascal = (id: string, ctx: string) => {
    if (!id) errors.push(`${ctx}: ID is required`);
    else if (!PASCAL_RE.test(id)) errors.push(`${ctx}: ID "${id}" must start with uppercase letter or underscore, then letters/numbers/underscores only`);
  };

  const checkField = (f: FieldDefinition, scope: 'block' | 'page' | 'product') => {
    checkPascal(f.id, `${scope} field`);
    if (!f.name?.sv?.trim() || !f.name?.en?.trim())
      errors.push(`${scope} field "${f.id}": names (sv/en) are required`);
    if (!SCHEMA_META.litiumMapping.fieldTypeToYaml[f.type])
      errors.push(`${scope} field "${f.id}": type "${f.type}" has no Litium mapping`);
    if (isOptionFieldType(f.type) && (!f.options || f.options.length === 0))
      errors.push(`${scope} field "${f.id}": ${f.type} requires at least one option`);
    if (f.type === 'Pointer') {
      if (!f.entityType) errors.push(`${scope} field "${f.id}": Pointer requires entityType`);
      else if (!SCHEMA_META.litiumMapping.pointerEntityTypes[f.entityType])
        errors.push(`${scope} field "${f.id}": entityType "${f.entityType}" not allowed`);
    }
    if (f.type === 'Multifield') {
      const pool =
        scope === 'block' ? blockFieldIds
        : scope === 'page' ? pageFieldIds
        : productFieldIds;
      if (!f.fields || f.fields.length === 0)
        errors.push(`${scope} field "${f.id}": Multifield must reference at least one existing field`);
      for (const fid of f.fields ?? []) {
        if (!pool.has(fid))
          errors.push(`${scope} field "${f.id}": Multifield references unknown field "${fid}"`);
      }
    }
  };

  blockFields.forEach((f) => checkField(f, 'block'));
  pageFields.forEach((f) => checkField(f, 'page'));
  productFields.forEach((f) => checkField(f, 'product'));

  for (const t of blockTemplates) {
    checkPascal(t.id, 'block template');
    if (!t.name?.sv?.trim() || !t.name?.en?.trim())
      errors.push(`block template "${t.id}": names (sv/en) are required`);
    for (const fid of t.fields) {
      if (!blockFieldIds.has(fid))
        errors.push(`block template "${t.id}": references unknown block field "${fid}"`);
    }
  }

  for (const t of pageTemplates) {
    checkPascal(t.id, 'page template');
    if (!t.name?.sv?.trim() || !t.name?.en?.trim())
      errors.push(`page template "${t.id}": names (sv/en) are required`);
    for (const fid of t.fields) {
      if (!pageFieldIds.has(fid))
        errors.push(`page template "${t.id}": references unknown page field "${fid}"`);
    }
    for (const bc of t.blockContainers) {
      checkPascal(bc.id, `page template "${t.id}" container`);
      if (bc.combination && !(BLOCK_COMBINATIONS as readonly string[]).includes(bc.combination))
        errors.push(`page template "${t.id}" container "${bc.id}": invalid combination "${bc.combination}"`);
      for (const bid of bc.allowedBlocks) {
        if (!blockTemplateIds.has(bid))
          errors.push(`page template "${t.id}" container "${bc.id}": unknown block template "${bid}"`);
      }
    }
  }

  for (const t of productTemplates) {
    checkPascal(t.id, 'product template');
    if (!t.name?.sv?.trim() || !t.name?.en?.trim())
      errors.push(`product template "${t.id}": names (sv/en) are required`);
    const templateType = t.type ?? 'Product';
    if (!(PRODUCT_TEMPLATE_TYPES as readonly string[]).includes(templateType))
      errors.push(`product template "${t.id}": type must be Product or Category`);

    const checkGroups = (groups: ProductFieldGroup[], kind: string) => {
      const groupSeen = new Set<string>();
      const hasDefault = groups.some((g) => g.id === DEFAULT_PRODUCT_GROUP_ID);
      if (!hasDefault)
        errors.push(`product template "${t.id}" ${kind}: must contain default group "${DEFAULT_PRODUCT_GROUP_ID}"`);
      for (const g of groups) {
        checkPascal(g.id, `product template "${t.id}" ${kind} group`);
        if (groupSeen.has(g.id))
          errors.push(`product template "${t.id}" ${kind}: duplicate field group "${g.id}"`);
        groupSeen.add(g.id);
        if (!g.name?.sv?.trim() || !g.name?.en?.trim())
          errors.push(`product template "${t.id}" group "${g.id}": names (sv/en) are required`);
        for (const fid of g.fields) {
          if (!productFieldIds.has(fid))
            errors.push(`product template "${t.id}" group "${g.id}": unknown product field "${fid}"`);
        }
      }
    };

    if (templateType === 'Category') {
      checkGroups(t.fieldGroups ?? [], 'fieldGroups');
    } else {
      checkGroups(t.productFieldGroups ?? [], 'productFieldGroups');
      checkGroups(t.variantFieldGroups ?? [], 'variantFieldGroups');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function withDefaults<T extends BlockTemplate | PageTemplate>(t: T): T {
  if ('blockContainers' in t) {
    const pt = t as PageTemplate;
    return {
      ...pt,
      fieldGroup: pt.fieldGroup ?? DEFAULT_FIELD_GROUP,
      blockContainers: (pt.blockContainers ?? []).map(withContainerDefaults),
    } as T;
  }
  return { ...t, fieldGroup: t.fieldGroup ?? DEFAULT_FIELD_GROUP };
}

export function withProductDefaults(t: ProductTemplate): ProductTemplate {
  const ensureDefault = (groups: ProductFieldGroup[] | undefined): ProductFieldGroup[] => {
    const list = Array.isArray(groups) ? [...groups] : [];
    if (!list.some((g) => g.id === DEFAULT_PRODUCT_GROUP_ID)) {
      list.unshift(makeDefaultProductGroup());
    }
    return list.map((g) => ({ ...g, fields: g.fields ?? [] }));
  };
  const type = t.type ?? 'Product';
  return {
    ...t,
    type,
    productFieldGroups: ensureDefault(t.productFieldGroups),
    variantFieldGroups: ensureDefault(t.variantFieldGroups),
    fieldGroups: ensureDefault(t.fieldGroups),
    useVariantUrl: type === 'Product' ? (t.useVariantUrl ?? false) : false,
  };
}
