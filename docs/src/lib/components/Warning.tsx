import { Callout } from "fumadocs-ui/components/callout";
import type { PropsWithChildren } from "react";

export const Warning: React.FC<PropsWithChildren> = ({ children }) => {
  return <Callout type="warn">{children}</Callout>;
};
