import { LLMService } from '../services/llm';
import { PromptTemplates } from '../utils/prompts';
import { Logger } from '../utils/logger';
import { SystemState, Plan, AgentResponse } from '../types';

export class PlannerAgent {
  constructor(private llm: LLMService) {}

  async createPlan(state: SystemState): Promise<AgentResponse<Plan>> {
    try {
      Logger.agent('Planner', state.plan ? 'Refining existing plan...' : 'Creating project plan...');
      
      const prompt = PromptTemplates.planner(state);
      const plan = await this.llm.chatJSON<Plan>(prompt);

      Logger.success('Planner', `Plan created with ${plan.steps.length} steps`);
      Logger.json('Planner', 'Plan details', plan);

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      Logger.error('Planner', `Planning failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}