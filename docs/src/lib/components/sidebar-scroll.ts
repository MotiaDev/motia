const SIDEBAR_SCROLL_STORAGE_KEY = "iii-docs-sidebar-scroll-top";

let restoredForPathname: string | null = null;

const getSidebarViewport = (): HTMLElement | null => {
  return (
    document.querySelector<HTMLElement>(
      "#nd-sidebar [data-radix-scroll-area-viewport]",
    ) ??
    document.querySelector<HTMLElement>(
      "#nd-sidebar-mobile [data-radix-scroll-area-viewport]",
    )
  );
};

export const saveSidebarScrollPosition = (): void => {
  if (typeof window === "undefined") return;

  const viewport = getSidebarViewport();
  if (!viewport) return;

  window.sessionStorage.setItem(
    SIDEBAR_SCROLL_STORAGE_KEY,
    String(viewport.scrollTop),
  );
};

export const restoreSidebarScrollPosition = (pathname: string): void => {
  if (typeof window === "undefined") return;
  if (restoredForPathname === pathname) return;
  restoredForPathname = pathname;

  const storedValue = window.sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
  if (!storedValue) return;

  const scrollTop = Number(storedValue);
  if (!Number.isFinite(scrollTop)) return;

  const apply = () => {
    const viewport = getSidebarViewport();
    if (!viewport) return;
    viewport.scrollTop = scrollTop;
  };

  apply();
  window.requestAnimationFrame(apply);
};
