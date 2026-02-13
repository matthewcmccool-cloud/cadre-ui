'use client';

import BookmarkButton from '@/components/BookmarkButton';

interface JobBookmarkButtonProps {
  jobId: string;
  jobTitle: string;
}

export default function JobBookmarkButton({ jobId, jobTitle }: JobBookmarkButtonProps) {
  return <BookmarkButton itemId={jobId} itemType="job" itemName={jobTitle} />;
}
