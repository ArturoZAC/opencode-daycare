import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/layouts/components/AppShell";
import { KidProfile } from "@/src/modules/kids/KidProfile";
import { getKid, KIDS } from "@/src/modules/kids/kids";

// Ruta de datos estáticos que debe poder bloquear para responder 404 real.
export const instant = false;

export function generateStaticParams() {
  return KIDS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/kids/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const child = getKid(slug);

  return { title: child ? child.name : "Niño no encontrado" };
}

export default async function KidPage({ params }: PageProps<"/kids/[slug]">) {
  const { slug } = await params;
  const child = getKid(slug);

  if (!child) {
    notFound();
  }

  return (
    <AppShell activeItem="kids">
      <KidProfile child={child} />
    </AppShell>
  );
}
