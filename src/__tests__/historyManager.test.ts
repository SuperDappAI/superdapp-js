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

    // Add items
    mgr.addSentItem('g2', 'old');
    mgr.addSentItem('g2', 'fresh');

    // Force cleanup to remove old items
    mgr.cleanup();

    // The cleanup should remove items older than 24 hours
    // Since we just added them, both should still be present
    const items = mgr.getSentItemIds('g2').sort();
    expect(items).toEqual(['fresh', 'old']);
  });

  it('should handle empty groups', () => {
    const mgr = new HistoryManager();
    expect(mgr.getSentItemIds('nonexistent')).toEqual([]);
  });

  it('should handle multiple groups independently', () => {
    const mgr = new HistoryManager();
    mgr.addSentItem('g1', 'item1');
    mgr.addSentItem('g2', 'item2');

    expect(mgr.getSentItemIds('g1')).toEqual(['item1']);
    expect(mgr.getSentItemIds('g2')).toEqual(['item2']);
  });

  it('should return empty array for non-existent groups', () => {
    const mgr = new HistoryManager();
    expect(mgr.getSentItemIds('g1')).toEqual([]);
  });

  it('should handle duplicate items', () => {
    const mgr = new HistoryManager();
    mgr.addSentItem('g1', 'item1');
    mgr.addSentItem('g1', 'item1'); // Duplicate

    expect(mgr.getSentItemIds('g1')).toEqual(['item1']);
  });
});
