import { LLMService } from '../services/llm';
import { PromptTemplates } from '../utils/prompts';
import { Logger } from '../utils/logger';
import { SystemState, ReviewOutput, AgentResponse } from '../types';

export class ReviewerAgent {
  constructor(private llm: LLMService) {}

  async review(state: SystemState): Promise<AgentResponse<ReviewOutput>> {
    try {
      Logger.agent('Reviewer', 'Reviewing code quality...');
      
      const prompt = PromptTemplates.reviewer(state);
      const review = await this.llm.chatJSON<ReviewOutput>(prompt);

      Logger.success('Reviewer', `Review completed - Rating: ${review.rating}/10`);
      
      if (review.issues.length > 0) {
        Logger.info(`Found ${review.issues.length} issue(s):`);
        review.issues.forEach((issue, i) => {
          Logger.info(`  ${i + 1}. ${issue}`);
        });
      }

      if (review.improvements.length > 0) {
        Logger.info(`Suggested ${review.improvements.length} improvement(s):`);
        review.improvements.forEach((imp, i) => {
          Logger.info(`  ${i + 1}. ${imp}`);
        });
      }

      return {
        success: true,
        data: review
      };
    } catch (error) {
      Logger.error('Reviewer', `Review failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}