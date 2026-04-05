import { LLMService } from '../services/llm';
import { PromptTemplates } from '../utils/prompts';
import { Logger } from '../utils/logger';
import { SystemState, OrchestratorDecision, AgentResponse } from '../types';

export class OrchestratorAgent {
  constructor(private llm: LLMService) {}

  async decide(state: SystemState): Promise<AgentResponse<OrchestratorDecision>> {
    try {
      Logger.agent('Orchestrator', 'Analyzing current state and deciding next action...');
      
      const prompt = PromptTemplates.orchestrator(state);
      const decision = await this.llm.chatJSON<OrchestratorDecision>(prompt);

      Logger.success('Orchestrator', `Decision: ${decision.nextAction}`);
      Logger.info(`Reasoning: ${decision.reasoning}`);

      return {
        success: true,
        data: decision
      };
    } catch (error) {
      Logger.error('Orchestrator', `Decision failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}