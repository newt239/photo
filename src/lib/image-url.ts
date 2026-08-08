export const photoImageUrl = (storageKey: string, width?: number) => {
  const path = storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/");
  return width === undefined ? `/api/i/${path}` : `/api/i/${path}?w=${width}`;
};
