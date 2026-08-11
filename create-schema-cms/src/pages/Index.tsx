import { useState } from 'react';
import { FieldsTab } from '@/components/FieldsTab';
import { BlockTemplatesTab } from '@/components/BlockTemplatesTab';
import { PageTemplatesTab } from '@/components/PageTemplatesTab';
import { ProductTemplatesTab } from '@/components/ProductTemplatesTab';
import { ImportExport } from '@/components/ImportExport';
import { JsonPreview } from '@/components/JsonPreview';
import { Blocks, FileText, LayoutTemplate, FileCode, Package, PackageOpen } from 'lucide-react';

const tabs = [
  { id: 'blockFields', label: 'Block Fields', icon: Blocks },
  { id: 'blockTemplates', label: 'Block Templates', icon: LayoutTemplate },
  { id: 'pageFields', label: 'Page Fields', icon: FileText },
  { id: 'pageTemplates', label: 'Page Templates', icon: FileCode },
  { id: 'productFields', label: 'Product Fields', icon: Package },
  { id: 'productTemplates', label: 'Product Templates', icon: PackageOpen },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>('blockFields');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Litium Schema Builder</h1>
              <p className="text-xs text-muted-foreground">Define fields, templates & containers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <JsonPreview />
            <ImportExport />
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card/30">
        <div className="container max-w-6xl mx-auto px-4 flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'blockFields' && <FieldsTab scope="block" />}
        {activeTab === 'blockTemplates' && <BlockTemplatesTab />}
        {activeTab === 'pageFields' && <FieldsTab scope="page" />}
        {activeTab === 'pageTemplates' && <PageTemplatesTab />}
        {activeTab === 'productFields' && <FieldsTab scope="product" />}
        {activeTab === 'productTemplates' && <ProductTemplatesTab />}
      </main>
    </div>
  );
}
