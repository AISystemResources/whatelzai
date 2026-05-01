import type { Metadata } from 'next';
import { revalidatePath } from 'next/cache';
import { getMediaAssets, updateMediaAsset, deleteMediaAsset } from '@/lib/media';
import type { MediaAsset } from '@/lib/media';
import { MediaManager } from './_components/MediaManager';

export const metadata: Metadata = { title: 'Media — whatelz.ai' };

async function saveAsset(
  id: string,
  patch: Partial<Pick<MediaAsset, 'label' | 'description' | 'destinations'>>,
) {
  'use server';
  await updateMediaAsset(id, patch);
  revalidatePath('/admin/media');
}

async function removeAsset(id: string) {
  'use server';
  await deleteMediaAsset(id);
  revalidatePath('/admin/media');
}

export default async function MediaPage() {
  const assets = await getMediaAssets();
  return <MediaManager assets={assets} onSave={saveAsset} onDelete={removeAsset} />;
}
