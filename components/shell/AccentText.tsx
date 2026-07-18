import { Fragment } from "react";

// Renders `{{accent:foo}}` markers as brand-yellow spans, and \n as line breaks.
// Used across landing-content sections so copy in Supabase can carry accents.
const ACCENT_RE = /\{\{accent:([^}]+)\}\}/g;

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  ACCENT_RE.lastIndex = 0;
  while ((match = ACCENT_RE.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    nodes.push(
      <span key={match.index} style={{ color: "var(--accent-text)" }}>
        {match[1]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function AccentText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
