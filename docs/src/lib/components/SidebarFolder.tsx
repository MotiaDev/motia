"use client";
import type { Folder } from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { SidebarItem } from "./SidebarItem";

export const SidebarFolder: React.FC<PropsWithChildren<{ item: Folder }>> = ({
  item,
  children,
}) => {
  const pathname = usePathname();
  const isActive = item.index && pathname === item.index.url;

  return (
    <div className="w-full flex flex-col items-start mt-6">
      {item.index ? (
        <Link
          href={item.index.url}
          className={[
            "text-sm font-medium px-2 rounded-md transition-colors",
            isActive
              ? "text-foreground font-semibold"
              : "text-foreground hover:text-foreground/80",
          ].join(" ")}
          aria-current={isActive ? "page" : undefined}
        >
          {item.name}
        </Link>
      ) : (
        <div className="text-sm font-medium px-2">{item.name}</div>
      )}
      <div className="w-full flex flex-col items-start py-2">
        {item.children.map((child) =>
          child.type === "page" ? (
            <SidebarItem key={child.$id} item={child} />
          ) : null,
        )}
      </div>
    </div>
  );
};
