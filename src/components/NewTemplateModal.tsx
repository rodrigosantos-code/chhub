import React, { useState } from 'react';
import { X, Layers, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { AspectRatioKey, MasterTemplate, TemplateType } from '../types';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTemplate: (template: MasterTemplate) => void;
}

export const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreateTemplate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('single');
  const [slideCount, setSlideCount] = useState(3);
  const [activeRatios, setActiveRatios] = useState<AspectRatioKey[]>(['1:1', '4:5', '9:16']);

  if (!isOpen) return null;

  const toggleRatio = (ratio: AspectRatioKey) => {
    if (activeRatios.includes(ratio)) {
      if (activeRatios.length > 1) {
        setActiveRatios(activeRatios.filter((r) => r !== ratio));
      }
    } else {
      if (activeRatios.length < 3) {
        setActiveRatios([...activeRatios, ratio]);
      }
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    const newTmpl: MasterTemplate = {
      id: `tmpl_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      templateType,
      slideCount: templateType === 'carousel' ? slideCount : undefined,
      activeAspectRatios: activeRatios,
      layers: [
        {
          id: `layer_bg_${Date.now()}`,
          name: 'Background',
          folderType: 'background',
          dynamizationType: 'by_folder',
          visible: true,
          carouselFixed: templateType === 'carousel' ? true : undefined,
          positionsByRatio: {
            '1:1': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '4:5': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '9:16': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
            '16:9': { x: 0, y: 0, width: 100, height: 100, opacity: 1, objectFit: 'cover' },
          },
        },
        {
          id: `layer_logo_${Date.now()}`,
          name: 'Logotipo',
          folderType: 'logo_1',
          dynamizationType: 'by_contrast',
          visible: true,
          carouselFixed: templateType === 'carousel' ? true : undefined,
          positionsByRatio: {
            '1:1': { x: 30, y: 8, width: 40, height: 12, opacity: 1, objectFit: 'contain' },
            '4:5': { x: 30, y: 8, width: 40, height: 12, opacity: 1, objectFit: 'contain' },
            '9:16': { x: 30, y: 10, width: 40, height: 10, opacity: 1, objectFit: 'contain' },
            '16:9': { x: 5, y: 8, width: 25, height: 15, opacity: 1, objectFit: 'contain' },
          },
        },
        {
          id: `layer_text_${Date.now()}`,
          name: 'Titular',
          folderType: 'texto_1',
          dynamizationType: 'by_folder',
          visible: true,
          carouselFixed: templateType === 'carousel' ? false : undefined,
          positionsByRatio: {
            '1:1': {
              x: 10, y: 75, width: 80, height: 15,
              fontSize: 52, fontWeight: 'black', textAlign: 'center', textColor: '#0F172A', opacity: 1,
            },
            '4:5': {
              x: 10, y: 75, width: 80, height: 15,
              fontSize: 52, fontWeight: 'black', textAlign: 'center', textColor: '#0F172A', opacity: 1,
            },
            '9:16': {
              x: 10, y: 75, width: 80, height: 15,
              fontSize: 56, fontWeight: 'black', textAlign: 'center', textColor: '#0F172A', opacity: 1,
            },
            '16:9': {
              x: 5, y: 50, width: 45, height: 25,
              fontSize: 44, fontWeight: 'black', textAlign: 'left', textColor: '#0F172A', opacity: 1,
            },
          },
        },
      ],
    };

    onCreateTemplate(newTmpl);
    onClose();
    // Reset form
    setName('');
    setDescription('');
    setTemplateType('single');
    setSlideCount(3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-md w-full space-y-4 text-xs text-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">Crear Nuevo Template</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Template Type Selector */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1.5">
              Tipo de plantilla
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('single')}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  templateType === 'single'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-bold text-xs">Single</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Una publicación individual
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('carousel')}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  templateType === 'carousel'
                    ? 'bg-violet-50 text-violet-700 border-violet-300 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-bold text-xs">Carrusel</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Varias slides en una publicación
                </div>
              </button>
            </div>
          </div>

          {/* Slide Count (carousel only) */}
          {templateType === 'carousel' && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
                Número de slides: <span className="text-violet-700 font-bold">{slideCount}</span>
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>2</span>
                <span>10</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
              Nombre del Template
            </label>
            <input
              type="text"
              placeholder="e.g. Flash Sale Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              placeholder="e.g. Advertising design with impactful copy"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
              Aspect Ratios activos (máx. 3)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['1:1', '4:5', '9:16', '16:9'] as AspectRatioKey[]).map((r) => {
                const isSelected = activeRatios.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRatio(r)}
                    className={`p-2 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs">{r}</div>
                    <div className="text-[10px] text-gray-500">
                      {r === '1:1'
                        ? 'Square Feed'
                        : r === '4:5'
                        ? 'Portrait Feed'
                        : r === '9:16'
                        ? 'Stories / Reels'
                        : 'Horizontal'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={handleCreate}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs disabled:opacity-40 shadow-xs cursor-pointer ${
              templateType === 'carousel'
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Crear {templateType === 'carousel' ? 'Carrusel' : 'Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
