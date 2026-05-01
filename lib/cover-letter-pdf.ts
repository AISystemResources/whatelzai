import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page:        { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#171717', lineHeight: 1.6 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  name:        { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#171717' },
  contact:     { fontSize: 8.5, fontFamily: 'Helvetica', color: '#71717a', textAlign: 'right' },
  divider:     { borderBottomWidth: 1, borderBottomColor: '#d4d4d8', marginBottom: 24 },
  date:        { fontSize: 9, color: '#71717a', marginBottom: 20 },
  para:        { marginBottom: 12 },
  signOff:     { marginTop: 20 },
});

function formatDate(): string {
  return new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Split cover letter into logical paragraphs, preserving salutation and sign-off
function parseParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

let _key = 0;
function k() { return String(_key++); }

export async function renderCoverLetterPdf(coverLetterText: string, companyName?: string): Promise<Buffer> {
  _key = 0;
  const paras = parseParagraphs(coverLetterText);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: S.page },
      // Header
      React.createElement(
        View,
        { style: S.headerRow },
        React.createElement(Text, { key: k(), style: S.name }, 'Edmund Lin Zhenming'),
        React.createElement(
          Text,
          { key: k(), style: S.contact },
          `elz.work22@gmail.com  ·  +65 8124 4215`
        ),
      ),
      React.createElement(View, { style: S.divider }),
      // Date
      React.createElement(Text, { key: k(), style: S.date }, formatDate()),
      // Body paragraphs
      ...paras.map((para, i) => {
        const isLast = i === paras.length - 1;
        return React.createElement(
          Text,
          { key: k(), style: isLast ? S.signOff : S.para },
          para,
        );
      }),
      // Company label watermark in footer (subtle)
      companyName
        ? React.createElement(
            View,
            { key: k(), style: { position: 'absolute', bottom: 28, right: 52 } },
            React.createElement(Text, { style: { fontSize: 7.5, color: '#a1a1aa' } }, companyName),
          )
        : React.createElement(View, { key: k() }),
    ),
  );

  return renderToBuffer(doc) as unknown as Buffer;
}
