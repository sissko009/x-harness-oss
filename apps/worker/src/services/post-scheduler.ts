import { XClient, XApiRateLimitError } from '@x-harness/x-sdk';
import { getDueScheduledPosts, updateScheduledPostStatus } from '@x-harness/db';

export async function processScheduledPosts(db: D1Database, xClient: XClient, xAccountId?: string): Promise<void> {
  const allDuePosts = await getDueScheduledPosts(db);
  const duePosts = xAccountId ? allDuePosts.filter((p) => p.x_account_id === xAccountId) : allDuePosts;

  for (const post of duePosts) {
    // Safety: skip mojibake posts (3+ consecutive '?' characters indicates
    // UTF-8 encoding failure during insertion). Mark as 'failed' so they
    // are not retried and do not pollute the account.
    if (/\?{3,}/.test(post.text)) {
      console.error(`Skipping mojibake scheduled post ${post.id}: text contains corrupted characters`);
      await updateScheduledPostStatus(db, post.id, 'failed');
      continue;
    }
    try {
      const tweet = await xClient.createTweet({
        text: post.text,
        media: post.media_ids ? { media_ids: JSON.parse(post.media_ids) } : undefined,
      });
      await updateScheduledPostStatus(db, post.id, 'posted', tweet.id);
    } catch (err) {
      if (err instanceof XApiRateLimitError) {
        // Transient rate limit — leave post as 'scheduled' so the next cron run retries
        console.error(`Rate limited while posting scheduled ${post.id}, will retry next run`);
        return;
      }
      console.error(`Failed to post scheduled ${post.id}:`, err);
      await updateScheduledPostStatus(db, post.id, 'failed');
    }
  }
}
