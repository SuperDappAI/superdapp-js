// Manager for tracking pending questions or state per user
export interface PendingQuestion {
  userId: string;
  questionType: string;
  groupNameOrId?: string;
  frequency?: string;
  topics?: string[];
  availableChannels?: unknown[];
  timestamp: number;
  [key: string]: unknown;
}

export class PendingQuestionsManager {
  private pendingQuestions: Map<string, PendingQuestion>;
  private readonly TIMEOUT_MS: number;

  constructor(timeoutMs = 5 * 60 * 1000) {
    this.pendingQuestions = new Map();
    this.TIMEOUT_MS = timeoutMs;
  }

  addPendingQuestion(question: PendingQuestion): void {
    this.pendingQuestions.set(question.userId, question);
  }

  getPendingQuestion(userId: string): PendingQuestion | undefined {
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
