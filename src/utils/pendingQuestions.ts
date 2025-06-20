// Generic manager for tracking pending questions or state per user (agent-agnostic)
export interface PendingQuestion<T = any> {
  userId: string;
  groupId: string;
  chatId: string;
  messageId: string;
  data?: T; // agent-specific payload (e.g., frequency, topics, etc.)
  type?: string; // agent-defined question type (e.g., 'FREQUENCY', 'TOPICS', etc.)
  timestamp: number;
}

export class PendingQuestionsManager<T = any> {
  private pendingQuestions: Map<string, PendingQuestion<T>>;
  private readonly TIMEOUT_MS: number;

  constructor(timeoutMs = 5 * 60 * 1000) {
    this.pendingQuestions = new Map();
    this.TIMEOUT_MS = timeoutMs;
  }

  addPendingQuestion(question: PendingQuestion<T>): void {
    this.pendingQuestions.set(question.userId, question);
  }

  getPendingQuestion(userId: string): PendingQuestion<T> | undefined {
    const question = this.pendingQuestions.get(userId);
    if (!question) return undefined;
    if (Date.now() - question.timestamp > this.TIMEOUT_MS) {
      this.pendingQuestions.delete(userId);
      return undefined;
    }
    return question;
  }

  removePendingQuestion(userId: string): void {
    this.pendingQuestions.delete(userId);
  }
}
