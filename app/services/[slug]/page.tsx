import { permanentRedirect } from "next/navigation";

// v1 sunset per DEC-CEO-004: /services surface is retired. All /services/*
// URLs 308 → /playbook. The rows still exist in the DB (status=retired) so
// this can be reversed when a services surface returns.
export default function LegacyServiceRedirect() {
  permanentRedirect("/playbook");
}
