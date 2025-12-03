export const isWebUrl = (url: string | undefined) => {
  if (!url) return false;
  return url.startsWith("http") || url.startsWith("https");
};
