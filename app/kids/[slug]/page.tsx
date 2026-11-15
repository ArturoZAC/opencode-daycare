import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/layouts/components/AppShell";
import { KidProfile } from "@/src/modules/kids/KidProfile";
import { getChildBySlug } from "@/src/modules/kids/queries";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/kids/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const child = await getChildBySlug(slug);

  return { title: child ? child.name : "Niño" };
}

export default async function KidPage({ params }: PageProps<"/kids/[slug]">) {
  const { slug } = await params;
  const child = await getChildBySlug(slug);

  if (!child) {
    notFound();
  }

  return (
    <AppShell activeItem="kids">
      <KidProfile child={child} />
    </AppShell>
  );
}
