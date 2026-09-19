import Link from "next/link";
import { FieldHero } from "@/components/editorial/FieldElements";
export default function NotFound() {
  return (
    <main>
      <FieldHero
        label="A small detour"
        title="This page hasn’t been written."
        description="The link might have moved, or the story might be somewhere else. There’s still plenty to explore."
        number="404"
      />
      <div className="field-wrap field-section">
        <Link href="/playbook" className="field-button">
          Start with the playbook ↗
        </Link>
        <Link href="/" className="text-link" style={{ marginLeft: 24 }}>
          Back to the beginning →
        </Link>
      </div>
    </main>
  );
}
