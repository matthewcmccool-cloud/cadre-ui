export const FREE_LIMITS = {
  job: 3,
  company: 3,
  investor: 3,
} as const;

export type BookmarkItemType = 'job' | 'company' | 'investor';

export function canBookmark(
  plan: 'free' | 'pro',
  itemType: BookmarkItemType,
  currentCount: number
): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_LIMITS[itemType];
}
