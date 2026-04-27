import { supabaseAdmin } from './supabase-server';

export const DESTINATIONS = ['landing', 'about', 'blog', 'hackathon', 'projects', 'other'] as const;
export type Destination = typeof DESTINATIONS[number];

export interface FocalPoint { x: number; y: number }
export interface CropHint   { x: number; y: number; width: number; height: number }

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
  focal_point: FocalPoint | null;
  crop_hint: CropHint | null;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getMediaAssets(opts?: {
  destination?: string;
  processed?: boolean;
  limit?: number;
}): Promise<MediaAsset[]> {
  let q = supabaseAdmin
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.destination) q = q.contains('destinations', [opts.destination]);
  if (typeof opts?.processed === 'boolean') q = q.eq('processed', opts.processed);

  const { data } = await q;
  return (data ?? []) as MediaAsset[];
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const { data } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .eq('id', id)
    .single();
  return data as MediaAsset | null;
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<Pick<MediaAsset, 'label' | 'description' | 'destinations' | 'focal_point' | 'crop_hint' | 'processed'>>,
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
