export const photoImageUrl = (storageKey: string): string => {
  const path = storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/");
  return `/api/i/${path}`;
};
