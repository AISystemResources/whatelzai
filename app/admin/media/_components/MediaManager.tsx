'use client';

import { useState, useRef } from 'react';
import type { MediaAsset } from '@/lib/media';
import { DESTINATIONS } from '@/lib/media';

interface Props {
  assets: MediaAsset[];
  onSave:   (id: string, patch: Partial<Pick<MediaAsset, 'label' | 'description' | 'destinations'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MediaManager({ assets: initial, onSave, onDelete }: Props) {
  const [assets,       setAssets]       = useState<MediaAsset[]>(initial);
  const [selected,     setSelected]     = useState<MediaAsset | null>(null);
  const [filter,       setFilter]       = useState('all');
  const [dragging,     setDragging]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [label,        setLabel]        = useState('');
  const [description,  setDescription]  = useState('');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [saving,       setSaving]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(asset: MediaAsset | null) {
    setSelected(asset);
    if (asset) {
      setLabel(asset.label);
      setDescription(asset.description);
      setDestinations(asset.destinations);
    }
  }

  const visible = filter === 'all'
    ? assets
    : assets.filter(a => a.destinations.includes(filter));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: MediaAsset[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/media/upload', { method: 'POST', body });
      if (res.ok) added.push(await res.json() as MediaAsset);
    }
    setAssets(prev => [...added, ...prev]);
    setUploading(false);
    if (added[0]) pick(added[0]);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    await onSave(selected.id, { label, description, destinations });
    setAssets(prev => prev.map(a =>
      a.id === selected.id ? { ...a, label, description, destinations } : a
    ));
    setSelected(s => s ? { ...s, label, description, destinations } : null);
    setSaving(false);
  }

  async function remove() {
    if (!selected || !confirm('Delete this image? This cannot be undone.')) return;
    await onDelete(selected.id);
    setAssets(prev => prev.filter(a => a.id !== selected.id));
    pick(null);
  }

  function toggleDest(d: string) {
    setDestinations(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  return (
    <div
      className={`flex gap-6 transition-all ${dragging ? 'outline outline-2 outline-offset-4 outline-zinc-400 rounded-xl' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
    >
      {/* ── Left: gallery ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Admin</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">Media</h1>
          </div>
          <div className="flex items-center gap-3">
            {uploading && <span className="font-mono text-xs text-zinc-400 animate-pulse">Uploading…</span>}
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-zinc-900 text-white text-sm font-medium px-3 py-1.5 rounded hover:opacity-80 transition-opacity"
            >
              + Upload
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => upload(e.target.files)} />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b border-zinc-200">
          {(['all', ...DESTINATIONS] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                filter === d
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {assets.length === 0 ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-zinc-200 rounded-xl p-20 text-center cursor-pointer hover:border-zinc-400 transition-colors"
          >
            <p className="text-zinc-400 font-mono text-sm">Drop images here or click to upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {visible.map(asset => (
              <button
                key={asset.id}
                onClick={() => pick(selected?.id === asset.id ? null : asset)}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selected?.id === asset.id ? 'border-zinc-900 shadow-md' : 'border-transparent hover:border-zinc-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
                  <p className="text-white text-xs font-medium truncate text-left">{asset.label}</p>
                </div>
                {asset.processed && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-black/50 text-emerald-400 text-[9px] font-mono px-1 py-0.5 rounded">✓ ai</span>
                  </div>
                )}
                {asset.destinations.length > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end">
                    {asset.destinations.slice(0, 2).map(d => (
                      <span key={d} className="bg-black/50 text-white text-[9px] font-mono px-1 py-0.5 rounded capitalize">{d}</span>
                    ))}
                    {asset.destinations.length > 2 && (
                      <span className="bg-black/50 text-white text-[9px] font-mono px-1 py-0.5 rounded">+{asset.destinations.length - 2}</span>
                    )}
                  </div>
                )}
              </button>
            ))}

            {/* Add tile */}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 transition-colors"
            >
              <span className="text-2xl leading-none text-zinc-300">+</span>
              <span className="text-xs text-zinc-400">Add</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Right: edit panel ── */}
      {selected && (
        <div className="w-72 shrink-0 space-y-4 border-l border-zinc-200 pl-6">
          {/* Preview */}
          <div className="aspect-square rounded-lg overflow-hidden bg-zinc-50 border border-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.label} className="w-full h-full object-contain" />
          </div>

          {/* Label */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional caption or alt text…"
              className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors resize-none placeholder:text-zinc-300"
            />
          </div>

          {/* Destinations */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Destinations</p>
            <div className="flex flex-wrap gap-1.5">
              {DESTINATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDest(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    destinations.includes(d)
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* AI analysis */}
          {selected.processed && (selected.focal_point || selected.crop_hint) && (
            <div className="space-y-0.5 text-[11px] font-mono text-zinc-400 border-t border-zinc-100 pt-3">
              <p className="text-emerald-500 font-semibold">✓ AI analysed</p>
              {selected.focal_point && (
                <p>focal: ({selected.focal_point.x.toFixed(2)}, {selected.focal_point.y.toFixed(2)})</p>
              )}
              {selected.crop_hint && (
                <p>crop: {selected.crop_hint.x.toFixed(2)},{selected.crop_hint.y.toFixed(2)} {selected.crop_hint.width.toFixed(2)}×{selected.crop_hint.height.toFixed(2)}</p>
              )}
            </div>
          )}

          {/* File info */}
          <div className="space-y-0.5 text-[11px] font-mono text-zinc-400">
            <p className="truncate">{selected.filename}</p>
            <p>
              {selected.mime_type}
              {selected.size_bytes ? ` · ${Math.round(selected.size_bytes / 1024)} KB` : ''}
            </p>
            <p>{new Date(selected.created_at).toLocaleDateString('en-SG', { dateStyle: 'medium' })}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-zinc-900 text-white text-sm font-medium py-2 rounded hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={remove}
              className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
