import { AssetGroup, MasterTemplate, Project } from '../types';

export function createEmptyAssetGroup(name = 'Asset Group 1'): AssetGroup {
  return {
    id: `ag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    folders: {
      background: [],
      logo_1: [],
      logo_2: [],
      logo_3: [],
      product_image_1: [],
      product_image_2: [],
      product_image_3: [],
      texto_1: {
        fileName: 'titulares.txt',
        content: '',
        variations: [],
      },
      texto_2: {
        fileName: 'subtitulos.txt',
        content: '',
        variations: [],
      },
      texto_3: {
        fileName: 'texto_3.txt',
        content: '',
        variations: [],
      },
      texto_4: {
        fileName: 'texto_4.txt',
        content: '',
        variations: [],
      },
    },
  };
}

export function createEmptyTemplate(name = 'Template 1'): MasterTemplate {
  return {
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    description: 'Dynamic advertising template',
    activeAspectRatios: ['1:1'],
    layers: [],
  };
}

export function createEmptyProject(name = 'My Brand', description = 'Brand project'): Project {
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    description,
    assetGroups: [createEmptyAssetGroup('Asset Group 1')],
    templates: [createEmptyTemplate('Template 1')],
  };
}

export const INITIAL_EMPTY_PROJECTS: Project[] = [
  createEmptyProject('My Brand', 'Initial brand project'),
];
