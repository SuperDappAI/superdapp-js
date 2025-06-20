import {
  PendingQuestionsManager,
  PendingQuestion,
} from '../utils/pendingQuestions';

describe('PendingQuestionsManager', () => {
  it('should add, get, and remove pending questions', () => {
    const mgr = new PendingQuestionsManager<{ foo: string }>();
    const q: PendingQuestion<{ foo: string }> = {
      userId: 'u1',
      groupId: 'g1',
      chatId: 'c1',
      messageId: 'm1',
      type: 'ANY_TYPE',
      data: { foo: 'bar' },
      timestamp: Date.now(),
    };
    mgr.addPendingQuestion(q);
    expect(mgr.getPendingQuestion('u1')).toEqual(q);
    mgr.removePendingQuestion('u1');
    expect(mgr.getPendingQuestion('u1')).toBeUndefined();
  });

  it('should expire questions after timeout', () => {
    const mgr = new PendingQuestionsManager();
    const now = Date.now();
    const q: PendingQuestion = {
      userId: 'u2',
      groupId: 'g2',
      chatId: 'c2',
      messageId: 'm2',
      type: 'EXPIRE',
      timestamp: now - 10 * 60 * 1000, // 10 min ago
    };
    mgr.addPendingQuestion(q);
    expect(mgr.getPendingQuestion('u2')).toBeUndefined();
  });
});
