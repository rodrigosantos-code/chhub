import React, { useState } from 'react';
import { Download, Send } from 'lucide-react';
import { Project } from '../types';
import { BulkExportModal } from './BulkExportModal';
import { PublishSection } from './PublishSection';

interface ExportSectionProps {
  project: Project;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<'bulk_export' | 'publish'>('bulk_export');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-8 pt-5 pb-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-900 mr-4">Export</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('bulk_export')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'bulk_export'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-violet-600" />
              Bulk Export
            </button>
            <button
              onClick={() => setActiveTab('publish')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'publish'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-purple-600" />
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'bulk_export' ? (
        <BulkExportModal
          project={project}
          onClose={() => {}}
        />
      ) : (
        <PublishSection project={project} />
      )}
    </div>
  );
};
