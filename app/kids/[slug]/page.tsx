import type { Metadata } from "next";
import { AppShell } from "@/src/layouts/components/AppShell";
import { KidProfile } from "@/src/modules/kids/KidProfile";
import { LocalKidProfile } from "@/src/modules/kids/LocalKidProfile";
import { getKid, KIDS } from "@/src/modules/kids/kids";

export const instant = false;

export function generateStaticParams() {
  return KIDS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/kids/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const child = getKid(slug);

  return { title: child ? child.name : "Niño" };
}

export default async function KidPage({ params }: PageProps<"/kids/[slug]">) {
  const { slug } = await params;
  const child = getKid(slug);

  return (
    <AppShell activeItem="kids">
      {child ? <KidProfile child={child} /> : <LocalKidProfile slug={slug} />}
    </AppShell>
  );
}
