import React, { useState } from 'react';
import { X, FolderTree, Plus } from 'lucide-react';
import { AssetGroup } from '../types';

interface NewAssetGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAssetGroup: (group: AssetGroup) => void;
}

export const NewAssetGroupModal: React.FC<NewAssetGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateAssetGroup,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;

    const newGroup: AssetGroup = {
      id: `ag_${Date.now()}`,
      name: name.trim(),
      folders: {
        background: [
          {
            id: `bg_${Date.now()}`,
            name: 'Minimal Grey Background',
            url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="%23F3F4F6"/><circle cx="540" cy="960" r="400" fill="%23E5E7EB"/></svg>',
            tone: 'light',
          },
        ],
        logo_1: [],
        logo_2: [],
        logo_3: [],
        product_image_1: [],
        product_image_2: [],
        product_image_3: [],
        texto_1: { files: [{
          id: `tf_${Date.now()}_t1`,
          fileName: 'titulares.txt',
          content: 'Big Occasion, Special Selection, Launch',
          variations: ['Big Occasion', 'Special Selection', 'Launch'],
        }] },
        texto_2: { files: [{
          id: `tf_${Date.now()}_t2`,
          fileName: 'subtitulos.txt',
          content: 'Available for a limited time',
          variations: ['Available for a limited time'],
        }] },
        texto_3: { files: [] },
        texto_4: { files: [] },
      },
    };

    onCreateAssetGroup(newGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-md w-full space-y-4 text-xs text-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">Crear Nuevo Asset Group</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            An Asset Group represents a brand collection or campaign (e.g. "Fall Collection", "Black Friday"). Contains the fixed resource folders.
          </p>

          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
              Nombre del Asset Group
            </label>
            <input
              type="text"
              placeholder="e.g. Fall/Winter Collection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={handleCreate}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 shadow-xs cursor-pointer"
          >
            Crear Asset Group
          </button>
        </div>
      </div>
    </div>
  );
};
