import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import { ServiceForm } from "../ServiceForm";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  return { title: `${s?.name ?? slug} — Services Admin` };
}

export default async function ServiceAdminEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  if (!s) notFound();
  return <ServiceForm initial={s} />;
}
