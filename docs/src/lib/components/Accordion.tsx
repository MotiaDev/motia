"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { type PropsWithChildren, useState } from "react";
import { Icon } from "./Icon";

export const AccordionGroup: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col border border-border bg-muted-background rounded-lg">
      {children}
    </div>
  );
};

type AccordionProps = PropsWithChildren<{
  title: string;
  description?: string;
  iconName?: string;
  defaultOpen?: boolean;
}>;

export const Accordion: React.FC<AccordionProps> = ({
  title,
  description,
  iconName,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="flex flex-row gap-1 items-center gap-2 px-4 hover:bg-white/5 p-2 cursor-pointer w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        {iconName && <Icon name={iconName} className="size-4" />}
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
