import type React from "react";
import { Cards } from "fumadocs-ui/components/card";
import type { PropsWithChildren } from "react";
import { cn } from "../utils";

const gridColsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

type ColumnsProps = PropsWithChildren<{
  cols?: number;
  className?: string;
}>;

export const Columns: React.FC<ColumnsProps> = ({
  cols = 2,
  className,
  children,
}) => {
  return (
    <Cards
      className={cn(
        cols !== 2 && gridColsMap[cols],
        className,
      )}
    >
      {children}
    </Cards>
  );
};
