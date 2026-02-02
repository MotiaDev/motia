"use client";
import type { Item } from "fumadocs-core/page-tree";
import Link from "next/link";

// To determine whether a Fumadocs sidebar item is active, we need to know the current route.
// In Next.js, we can use `usePathname()` from 'next/navigation' to get the current path.
// Typically, an item is active if the current pathname matches (or possibly starts with) the item's url.
// Here is an implementation:

import { usePathname } from "next/navigation";

export const SidebarItem: React.FC<{ item: Item }> = ({ item }) => {
  const pathname = usePathname();
  const isActive = pathname === item.url;

  return (
    <Link
      className="group flex cursor-pointer w-full"
      href={item.url}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex-1 flex w-full">
        <div
          className={[
            "w-full text-sm font-light rounded-md p-2 transition-colors",
            isActive
              ? "bg-muted-background text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground/80 hover:bg-muted-background/50",
          ].join(" ")}
        >
          {item.name}
        </div>
      </div>
    </Link>
  );
};
