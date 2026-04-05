import { LLMService } from '../services/llm';
import { PromptTemplates } from '../utils/prompts';
import { Logger } from '../utils/logger';
import { SystemState, ResearchOutput, AgentResponse } from '../types';

export class ResearcherAgent {
  constructor(private llm: LLMService) {}

  async research(state: SystemState): Promise<AgentResponse<ResearchOutput>> {
    try {
      Logger.agent('Researcher', 'Gathering best practices and recommendations...');
      
      const prompt = PromptTemplates.researcher(state);
      const research = await this.llm.chatJSON<ResearchOutput>(prompt);

      Logger.success('Researcher', 'Research completed');
      Logger.info(`Found ${research.bestPractices.length} best practices`);
      Logger.info(`Generated ${research.recommendations.length} recommendations`);

      return {
        success: true,
        data: research
      };
    } catch (error) {
      Logger.error('Researcher', `Research failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}