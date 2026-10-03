import { type TeamPerson } from "./model";

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 128;
const GAP = 28;
const LEVEL = NODE_HEIGHT + 64;
const PADDING = 24;

export type PositionedPerson = { person: TeamPerson; x: number; y: number };

// Lay out only the already-authorized people supplied by the server. Each
// subtree occupies its leaf count in columns; parents sit above their children.
export function layoutTeamNodes(people: TeamPerson[]) {
  const ids = new Set(people.map((person) => person.id));
  const children = new Map<string, TeamPerson[]>();
  const roots: TeamPerson[] = [];
  for (const person of people) {
    const sponsor = person.sponsor_person_id;
    if (!sponsor || !ids.has(sponsor)) roots.push(person);
    else {
      const siblings = children.get(sponsor) ?? [];
      siblings.push(person);
      children.set(sponsor, siblings);
    }
  }
  const traversal: TeamPerson[] = [];
  const pending = [...roots];
  while (pending.length) {
    const person = pending.pop()!;
    traversal.push(person);
    pending.push(...(children.get(person.id) ?? []));
  }
  const spans = new Map<string, number>();
  for (const person of traversal.reverse()) {
    const span = (children.get(person.id) ?? []).reduce(
      (sum, child) => sum + spans.get(child.id)!,
      0,
    );
    spans.set(person.id, Math.max(1, span));
  }
  const nodes: PositionedPerson[] = [];
  const positions: { person: TeamPerson; column: number; depth: number }[] = [];
  let column = 0;
  for (const person of roots) {
    positions.push({ person, column, depth: 0 });
    column += spans.get(person.id)!;
  }
  let maxDepth = 0;
  while (positions.length) {
    const { person, column, depth } = positions.pop()!;
    maxDepth = Math.max(maxDepth, depth);
    nodes.push({
      person,
      x:
        PADDING +
        (column + (spans.get(person.id)! - 1) / 2) * (NODE_WIDTH + GAP),
      y: PADDING + depth * LEVEL,
    });
    let childColumn = column;
    for (const child of children.get(person.id) ?? []) {
      positions.push({ person: child, column: childColumn, depth: depth + 1 });
      childColumn += spans.get(child.id)!;
    }
  }
  nodes.sort((a, b) => a.y - b.y || a.x - b.x);
  const byId = new Map(nodes.map((node) => [node.person.id, node]));
  const edges = nodes.flatMap((node) => {
    const parent = byId.get(node.person.sponsor_person_id ?? "");
    return parent ? [{ parent, child: node }] : [];
  });
  return {
    nodes,
    edges,
    width: PADDING * 2 + Math.max(1, column) * (NODE_WIDTH + GAP) - GAP,
    height: PADDING * 2 + (people.length ? maxDepth * LEVEL + NODE_HEIGHT : 0),
  };
}
