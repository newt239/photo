export const photoImageUrl = (storageKey: string) => {
  const path = storageKey.replace(/^users\/(?<owner>[^/]+)\/photos\//, "$<owner>/");
  return `/api/i/${path}`;
};
