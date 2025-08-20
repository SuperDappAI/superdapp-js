import {
  PendingQuestionsManager,
  PendingQuestion,
} from '../utils/pendingQuestions';

describe('PendingQuestionsManager', () => {
  it('should add, get, and remove pending questions', () => {
    const mgr = new PendingQuestionsManager();
    const q: PendingQuestion = {
      userId: 'u1',
      questionType: 'ANY_TYPE',
      groupNameOrId: 'g1',
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
      questionType: 'EXPIRE',
      groupNameOrId: 'g2',
      timestamp: now - 10 * 60 * 1000, // 10 min ago
    };
    mgr.addPendingQuestion(q);
    expect(mgr.getPendingQuestion('u2')).toBeUndefined();
  });
});
