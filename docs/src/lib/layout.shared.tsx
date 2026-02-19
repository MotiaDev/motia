import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { NavTitle } from "@/lib/components/NavTitle";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <NavTitle />, url: "/docs" },
  };
}
