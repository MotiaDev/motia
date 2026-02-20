"use client";
import type { Item } from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPathMatch } from "@/lib/path";

export const SidebarItem: React.FC<{ item: Item; depth?: number }> = ({
  item,
  depth = 0,
}) => {
  const pathname = usePathname();
  const isActive = isPathMatch(pathname, item.url);
  const indentation = depth > 0 ? "pl-4" : "";

  return (
    <Link
      className="group flex w-full cursor-pointer"
      href={item.url}
      aria-current={isActive ? "page" : undefined}
    >
      <div className={`flex w-full flex-1 ${indentation}`}>
        <div
          className={[
            "w-full rounded-md px-3 py-2 text-sm font-normal transition-all",
            isActive
              ? "bg-primary/10 text-foreground shadow-[inset_2px_0_0_var(--color-fd-primary)]"
              : "text-muted-foreground hover:bg-muted-background/60 hover:text-foreground",
          ].join(" ")}
        >
          {item.name}
        </div>
      </div>
    </Link>
  );
};
