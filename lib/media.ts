import { supabaseAdmin } from './supabase-server';

export const DESTINATIONS = ['landing', 'about', 'blog', 'hackathon', 'projects', 'other'] as const;
export type Destination = typeof DESTINATIONS[number];

export interface MediaAsset {
  id: string;
  storage_path: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number | null;
  label: string;
  description: string;
  destinations: string[];
  created_at: string;
  updated_at: string;
}

export async function getMediaAssets(): Promise<MediaAsset[]> {
  const { data } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as MediaAsset[];
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<Pick<MediaAsset, 'label' | 'description' | 'destinations'>>,
) {
  const { error } = await supabaseAdmin.from('media_assets').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteMediaAsset(id: string) {
  const { data } = await supabaseAdmin
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (data?.storage_path) {
    await supabaseAdmin.storage.from('media').remove([data.storage_path]);
  }

  const { error } = await supabaseAdmin.from('media_assets').delete().eq('id', id);
  if (error) throw error;
}
