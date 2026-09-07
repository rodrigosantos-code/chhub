import { supabase } from './supabase';
import { Project } from '../types';
import { stripImagesForCloud } from './imageCompressor';

export interface DBProject {
  id: string;
  name: string;
  description: string;
  data: Project;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all projects from Supabase.
 */
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching projects:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  return (data as DBProject[]).map((row) => row.data);
}

/**
 * Save (upsert) a single project to Supabase.
 * Uses the project's own `id` as the DB row id.
 */
export async function saveProject(project: Project): Promise<void> {
  // Strip base64 images — they stay in localStorage only
  const cleanProject = stripImagesForCloud(project);

  const { error } = await supabase.from('projects').upsert(
    {
      id: cleanProject.id,
      name: cleanProject.name,
      description: cleanProject.description,
      data: cleanProject,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[Supabase] Error saving project:', error.message);
  }
}

/**
 * Save all projects at once.
 * Strips base64 images before saving — images live only in localStorage.
 */
export async function saveAllProjects(projects: Project[]): Promise<void> {
  // Strip base64 images from all projects
  const cleanProjects = projects.map((p) => stripImagesForCloud(p));

  const rows = cleanProjects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    data: p,
    updated_at: new Date().toISOString(),
  }));

  const payloadSize = new Blob([JSON.stringify(rows)]).size;
  console.log(`[Supabase] Saving ${rows.length} projects (${(payloadSize / 1024).toFixed(1)} KB)`);

  const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[Supabase] Error saving all projects:', error.message, error.details, error.hint);
    throw new Error(error.message);
  }
}

/**
 * Delete a project from Supabase.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error('[Supabase] Error deleting project:', error.message);
  }
}

/**
 * Sync local projects to Supabase: removes DB rows whose IDs are no longer in the local list.
 */
export async function syncDeletedProjects(localProjectIds: string[]): Promise<void> {
  const { data, error } = await supabase.from('projects').select('id');
  if (error || !data) return;

  const dbIds = (data as { id: string }[]).map((r) => r.id);
  const toDelete = dbIds.filter((id) => !localProjectIds.includes(id));

  for (const id of toDelete) {
    await deleteProject(id);
  }
}
