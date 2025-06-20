import { HistoryManager } from '../utils/historyManager';

describe('HistoryManager', () => {
  it('should add and retrieve sent items per group', () => {
    const mgr = new HistoryManager();
    mgr.addSentItem('g1', 'item1');
    mgr.addSentItem('g1', 'item2');
    expect(mgr.getSentItemIds('g1').sort()).toEqual(['item1', 'item2']);
  });

  it('should cleanup old items', () => {
    const mgr = new HistoryManager();
    const now = Date.now();
    // Add one old, one new
    (mgr as any).history.set('g2', {
      old: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      fresh: new Date(now).toISOString(),
    });
    mgr.cleanup();
    expect(mgr.getSentItemIds('g2')).toEqual(['fresh']);
  });
});
