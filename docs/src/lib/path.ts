export const isPathMatch = (pathname: string, url: string): boolean => {
  const normalizedPathname = pathname.replace(/\/$/, "");
  const normalizedUrl = url.replace(/\/$/, "");
  return (
    normalizedPathname === normalizedUrl ||
    (normalizedUrl !== "/" &&
      normalizedPathname.startsWith(`${normalizedUrl}/`))
  );
};
