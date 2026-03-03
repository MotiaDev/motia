const normalizePath = (path: string): string => {
  const normalized = path.replace(/\/$/, "");
  return normalized === "" ? "/" : normalized;
};

export const isExactPathMatch = (pathname: string, url: string): boolean => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedUrl = normalizePath(url);
  return normalizedPathname === normalizedUrl;
};

export const isPathMatch = (pathname: string, url: string): boolean => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedUrl = normalizePath(url);
  return (
    normalizedPathname === normalizedUrl ||
    (normalizedUrl !== "/" &&
      normalizedPathname.startsWith(`${normalizedUrl}/`))
  );
};
