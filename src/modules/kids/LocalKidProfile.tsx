"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KidProfile } from "./KidProfile";
import type { Child } from "./kids";
import { getStoredKid } from "./kidsStore";

export function LocalKidProfile({ slug }: { slug: string }) {
  const [child, setChild] = useState<Child | null>();

  useEffect(() => {
    setChild(getStoredKid(slug) ?? null);
  }, [slug]);

  if (child === undefined) {
    return null;
  }

  if (child === null) {
    return (
      <div className="mx-auto w-full max-w-[820px] px-5 pb-28 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
        <p className="text-[15px] text-muted">No encontramos ese niño.</p>
        <Link
          href="/kids"
          className="mt-4 inline-block text-sm font-bold text-coral-deep"
        >
          Volver a Niños
        </Link>
      </div>
    );
  }

  return <KidProfile child={child} />;
}
