import * as dotenv from 'dotenv';
import { LLMService } from './services/llm';
import { OrchestratorAgent } from './agents/orchestrator';
import { PlannerAgent } from './agents/planner';
import { ResearcherAgent } from './agents/researcher';
import { CoderAgent } from './agents/coder';
import { ReviewerAgent } from './agents/reviewer';
import { Logger } from './utils/logger';
import { SystemState, AgentAction } from './types';

dotenv.config();

class MultiAgentSystem {
  private llm: LLMService;
  private orchestrator: OrchestratorAgent;
  private planner: PlannerAgent;
  private researcher: ResearcherAgent;
  private coder: CoderAgent;
  private reviewer: ReviewerAgent;
  private maxIterations: number;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    const model = process.env.MODEL_NAME || 'claude-3-5-sonnet-20241022';
    this.maxIterations = parseInt(process.env.MAX_ITERATIONS || '10');

    this.llm = new LLMService(apiKey, model);
    this.orchestrator = new OrchestratorAgent(this.llm);
    this.planner = new PlannerAgent(this.llm);
    this.researcher = new ResearcherAgent(this.llm);
    this.coder = new CoderAgent(this.llm);
    this.reviewer = new ReviewerAgent(this.llm);
  }

  private initializeState(userInput: string): SystemState {
    return {
      userInput,
      reviews: [],
      currentStep: 0,
      iterations: 0,
      actionHistory: [],
      conversationContext: []
    };
  }

  async run(userInput: string): Promise<void> {
    Logger.header('MULTI-AGENT UNIVERSE - Starting');
    Logger.info(`User Request: "${userInput}"`);
    Logger.divider();

    const state = this.initializeState(userInput);

    while (state.iterations < this.maxIterations) {
      state.iterations++;
      Logger.divider();
      Logger.info(`Iteration ${state.iterations}/${this.maxIterations}`);
      Logger.divider();

      // Orchestrator decides next action
      const decisionResponse = await this.orchestrator.decide(state);
      
      if (!decisionResponse.success || !decisionResponse.data) {
        Logger.error('System', 'Orchestrator failed to make a decision');
        break;
      }

      const decision = decisionResponse.data;
      state.actionHistory.push(decision.nextAction);

      // Execute the decided action
      const actionSuccess = await this.executeAction(decision.nextAction, state);
      
      if (!actionSuccess) {
        Logger.error('System', `Action ${decision.nextAction} failed`);
        break;
      }

      // Check if we're done
      if (decision.nextAction === AgentAction.DONE) {
        Logger.divider();
        Logger.header('TASK COMPLETED');
        this.displayFinalOutput(state);
        break;
      }
    }

    if (state.iterations >= this.maxIterations) {
      Logger.error('System', 'Max iterations reached without completion');
    }
  }

  private async executeAction(action: AgentAction, state: SystemState): Promise<boolean> {
    switch (action) {
      case AgentAction.PLAN:
      case AgentAction.REFINE_PLAN: {
        const response = await this.planner.createPlan(state);
        if (response.success && response.data) {
          state.plan = response.data;
          return true;
        }
        return false;
      }

      case AgentAction.RESEARCH: {
        const response = await this.researcher.research(state);
        if (response.success && response.data) {
          state.research = response.data;
          return true;
        }
        return false;
      }

      case AgentAction.CODE: {
        const response = await this.coder.generateCode(state);
        if (response.success && response.data) {
          state.code = response.data;
          
          // Update current step status if applicable
          if (state.plan && state.currentStep < state.plan.steps.length) {
            state.plan.steps[state.currentStep].status = 'completed';
            state.plan.steps[state.currentStep].output = JSON.stringify(response.data);
            state.currentStep++;
          }
          
          return true;
        }
        return false;
      }

      case AgentAction.REVIEW: {
        const response = await this.reviewer.review(state);
        if (response.success && response.data) {
          state.reviews.push(response.data);
          
          // If review suggests improvements and provides improved code, use it
          if (response.data.improvedCode) {
            state.code = response.data.improvedCode;
            Logger.success('System', 'Code updated with improvements');
          }
          
          return true;
        }
        return false;
      }

      case AgentAction.DONE: {
        return true;
      }

      default: {
        Logger.error('System', `Unknown action: ${action}`);
        return false;
      }
    }
  }

  private displayFinalOutput(state: SystemState): void {
    Logger.divider();
    
    if (state.plan) {
      Logger.agent('System', 'Final Plan:');
      console.log(JSON.stringify(state.plan, null, 2));
      Logger.divider();
    }

    if (state.research) {
      Logger.agent('System', 'Research Insights:');
      console.log(JSON.stringify(state.research, null, 2));
      Logger.divider();
    }

    if (state.code) {
      Logger.agent('System', 'Generated Code:');
      state.code.files.forEach(file => {
        Logger.success('System', `File: ${file.filename}`);
        console.log('```' + file.language);
        console.log(file.content);
        console.log('```\n');
      });
      Logger.divider();
    }

    if (state.reviews.length > 0) {
      const finalReview = state.reviews[state.reviews.length - 1];
      Logger.agent('System', `Final Review Rating: ${finalReview.rating}/10`);
      Logger.divider();
    }

    Logger.success('System', `Completed in ${state.iterations} iterations`);
    Logger.info(`Action sequence: ${state.actionHistory.join(' → ')}`);
  }
}

// Main execution
async function main() {
  try {
    const system = new MultiAgentSystem();
    
    // Example task - can be changed to any request
    const userInput = process.argv[2] || 
      "Build a REST API for an expense tracker with user authentication, expense CRUD operations, and category management";

    await system.run(userInput);
  } catch (error) {
    Logger.error('System', `Fatal error: ${error}`);
    process.exit(1);
  }
}

main();