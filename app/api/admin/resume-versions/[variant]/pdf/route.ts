import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { getResumeVersion, setResumeVersionPdf } from '@/lib/resume-versions';
import { supabaseAdmin } from '@/lib/supabase-server';

// ── PDF styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:      { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#171717' },
  h1:        { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  h2:        { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#d4d4d8', paddingBottom: 2 },
  h3:        { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 2 },
  p:         { lineHeight: 1.5, marginBottom: 4 },
  bullet:    { flexDirection: 'row', marginBottom: 2, paddingLeft: 8 },
  bulletDot: { width: 12, color: '#71717a' },
  bulletText:{ flex: 1, lineHeight: 1.5 },
  bold:      { fontFamily: 'Helvetica-Bold' },
  italic:    { fontFamily: 'Helvetica-Oblique' },
});

// ── Inline text parser (bold, italic) ────────────────────────────────────────
function parseInline(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(React.createElement(Text, { key: key++ }, line.slice(last, m.index)));
    if (m[2]) parts.push(React.createElement(Text, { key: key++, style: S.bold }, m[2]));
    else if (m[3]) parts.push(React.createElement(Text, { key: key++, style: S.italic }, m[3]));
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(React.createElement(Text, { key: key++ }, line.slice(last)));
  return parts;
}

// ── Markdown → @react-pdf/renderer elements ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function markdownToPdf(markdown: string): React.ReactElement<any> {
  const lines = markdown.split('\n');
  const children: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# '))  { children.push(React.createElement(Text, { key: key++, style: S.h1 }, line.slice(2))); continue; }
    if (line.startsWith('## ')) { children.push(React.createElement(Text, { key: key++, style: S.h2 }, line.slice(3))); continue; }
    if (line.startsWith('### ')){ children.push(React.createElement(Text, { key: key++, style: S.h3 }, line.slice(4))); continue; }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.slice(2);
      children.push(
        React.createElement(View, { key: key++, style: S.bullet },
          React.createElement(Text, { style: S.bulletDot }, '•'),
          React.createElement(Text, { style: S.bulletText }, ...parseInline(text)),
        )
      );
      continue;
    }
    if (line.trim() === '') continue;
    children.push(React.createElement(Text, { key: key++, style: S.p }, ...parseInline(line)));
  }

  return React.createElement(
    Document,
    null,
    React.createElement(Page, { size: 'A4', style: S.page }, ...children),
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const decoded = decodeURIComponent(variant);

  const version = await getResumeVersion(decoded);
  if (!version) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  if (!version.content.trim()) return NextResponse.json({ error: 'No content to export' }, { status: 400 });

  const doc = markdownToPdf(version.content);
  const buffer = await renderToBuffer(doc);

  const slug = decoded.toLowerCase().replace(/\s+/g, '-');
  const path = `${slug}/resume-${Date.now()}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('resumes')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from('resumes').getPublicUrl(path);
  const pdf_url = urlData.publicUrl;

  await setResumeVersionPdf(decoded, pdf_url, path);

  return NextResponse.json({ pdf_url });
}
