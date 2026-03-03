import {
  Card as FumadocsCard,
  type CardProps as FumadocsCardProps,
} from "fumadocs-ui/components/card";
import { cn } from "../utils";

type CardProps = FumadocsCardProps & {
  horizontal?: boolean;
};

export function Card({ horizontal, className, ...props }: CardProps) {
  return (
    <FumadocsCard
      {...props}
      className={cn(horizontal && "flex-row items-center", className)}
    />
  );
}
