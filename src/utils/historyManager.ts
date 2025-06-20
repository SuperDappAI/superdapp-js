// Generic manager for tracking sent items per group/user (not news-specific)
export class HistoryManager {
  private history: Map<string, { [itemId: string]: string }>; // groupId -> {itemId: timestamp}
  private readonly TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.history = new Map();
  }

  addSentItem(groupId: string, itemId: string): void {
    const now = new Date().toISOString();
    if (!this.history.has(groupId)) this.history.set(groupId, {});
    this.history.get(groupId)![itemId] = now;
  }

  getSentItemIds(groupId: string): string[] {
    const groupHistory = this.history.get(groupId) || {};
    const oneDayAgo = Date.now() - this.TIMEOUT_MS;
    // Clean up old entries
    Object.entries(groupHistory).forEach(([itemId, ts]) => {
      if (new Date(ts).getTime() < oneDayAgo) {
        delete groupHistory[itemId];
      }
    });
    return Object.keys(groupHistory);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [groupId, groupHistory] of this.history.entries()) {
      Object.entries(groupHistory).forEach(([itemId, ts]) => {
        if (new Date(ts).getTime() < now - this.TIMEOUT_MS) {
          delete groupHistory[itemId];
        }
      });
    }
  }
}
