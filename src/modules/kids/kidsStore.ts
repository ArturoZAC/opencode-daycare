import { CHILD_COLOR_ORDER, KIDS, type Child, type ChildColor } from "./kids";

let children: Child[] = [...KIDS];

export function listKids(): Child[] {
  return children;
}

export function getStoredKid(slug: string): Child | undefined {
  return children.find((child) => child.slug === slug);
}

export function addChild(child: Child): void {
  children = [...children, child];
}

export function nextChildColor(): ChildColor {
  return CHILD_COLOR_ORDER[children.length % CHILD_COLOR_ORDER.length];
}

export function uniqueSlug(base: string): string {
  if (!children.some((child) => child.slug === base)) {
    return base;
  }

  let suffix = 2;

  while (children.some((child) => child.slug === `${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}
