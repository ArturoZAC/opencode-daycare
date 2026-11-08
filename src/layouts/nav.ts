import type { ComponentType } from "react";
import {
  BellIcon,
  HomeIcon,
  type IconProps,
  UserIcon,
  UsersIcon,
} from "@/src/components/Icons";

export type NavItem = "feed" | "kids";

export type NavEntry = {
  id: NavItem | "avisos" | "mi-cuenta";
  label: string;
  icon: ComponentType<IconProps>;
  href?: string;
};

export const NAV_ITEMS: NavEntry[] = [
  { id: "feed", label: "Feed", icon: HomeIcon, href: "/" },
  { id: "kids", label: "Niños", icon: UsersIcon, href: "/kids" },
  { id: "avisos", label: "Avisos", icon: BellIcon },
  { id: "mi-cuenta", label: "Mi cuenta", icon: UserIcon },
];
