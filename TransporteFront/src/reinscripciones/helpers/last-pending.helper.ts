type TitularKey = string | number;

interface LastPendingConfig<TItem> {
  titularKey: TitularKey | null | undefined;
  collection: TItem[];
  getTitularKey: (item: TItem) => TitularKey | null | undefined;
  isPending?: (item: TItem) => boolean;
}

export const isLastPendingForTitular = <TItem,>({
  titularKey,
  collection,
  getTitularKey,
  isPending,
}: LastPendingConfig<TItem>): boolean => {
  if (titularKey === null || titularKey === undefined) {
    return false;
  }

  if (!Array.isArray(collection) || collection.length === 0) {
    return false;
  }

  const matchingItems = collection.filter((item) => getTitularKey(item) === titularKey);

  if (matchingItems.length === 0) {
    return false;
  }

  const pendingItems = isPending ? matchingItems.filter((item) => isPending(item)) : matchingItems;

  if (pendingItems.length === 0) {
    return false;
  }

  return pendingItems.length === 1;
};

export type { LastPendingConfig };
