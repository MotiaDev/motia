import { Cards } from "fumadocs-ui/components/card";
import type { PropsWithChildren } from "react";
import { cn } from "../utils";

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
        cols !== 2 && `grid-cols-${cols}`,
        className,
      )}
    >
      {children}
    </Cards>
  );
};
