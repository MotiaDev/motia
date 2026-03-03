"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { type PropsWithChildren, useState } from "react";
import { cn } from "../utils";
import { Icon } from "./Icon";

type ExpandableProps = PropsWithChildren<{
  title: string;
  description?: string;
  iconName?: string;
  defaultOpen?: boolean;
}>;

export const Expandable: React.FC<ExpandableProps> = ({
  title,
  description,
  iconName,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `expandable-content-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col rounded-lg border border-border">
      {iconName && <Icon name={iconName} className="size-6" />}
      <button
        type="button"
        className={cn(
          "flex flex-row gap-1 items-center gap-2 px-4 border-border hover:bg-muted-background p-2 cursor-pointer w-full text-left",
          isOpen ? "bg-muted-background border-b" : "hover:bg-muted-background",
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <h3 className="text-sm font-semibold m-1!">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </button>
      {isOpen && (
        <div id={contentId} className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};
