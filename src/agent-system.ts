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

// Import broadcast function if running as server
let broadcast: ((data: any) => void) | null = null;
try {
  const serverModule = require('./server');
  broadcast = serverModule.broadcast;
} catch (e) {
  // Running standalone
}

export class MultiAgentSystem {
  private llm: LLMService;
  private orchestrator: OrchestratorAgent;
  private planner: PlannerAgent;
  private researcher: ResearcherAgent;
  private coder: CoderAgent;
  private reviewer: ReviewerAgent;
  private maxIterations: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const model = process.env.MODEL_NAME || 'gpt-4o';
    this.maxIterations = parseInt(process.env.MAX_ITERATIONS || '10');

    this.llm = new LLMService(apiKey, model);
    this.orchestrator = new OrchestratorAgent(this.llm);
    this.planner = new PlannerAgent(this.llm);
    this.researcher = new ResearcherAgent(this.llm);
    this.coder = new CoderAgent(this.llm);
    this.reviewer = new ReviewerAgent(this.llm);
  }

  private emit(type: string, data: any) {
    if (broadcast) {
      broadcast({ type, data, timestamp: new Date().toISOString() });
    }
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
    this.emit('start', { userInput });

    const state = this.initializeState(userInput);

    while (state.iterations < this.maxIterations) {
      state.iterations++;
      Logger.divider();
      Logger.info(`Iteration ${state.iterations}/${this.maxIterations}`);
      
      this.emit('iteration', { 
        current: state.iterations, 
        max: this.maxIterations 
      });

      // Safety net: force completion if we have code and are running low on iterations
      const iterationsLeft = this.maxIterations - state.iterations;
      if (iterationsLeft <= 2 && state.code && state.reviews.length > 0) {
        Logger.info('Approaching iteration limit with code ready — completing task.');
        Logger.header('TASK COMPLETED');
        this.emit('complete', { 
          state,
          iterations: state.iterations 
        });
        this.displayFinalOutput(state);
        return;
      }

      // Orchestrator decides
      const decisionResponse = await this.orchestrator.decide(state);
      
      if (!decisionResponse.success || !decisionResponse.data) {
        Logger.error('System', 'Orchestrator failed');
        this.emit('error', { message: 'Orchestrator failed to decide' });
        break;
      }

      const decision = decisionResponse.data;
      state.actionHistory.push(decision.nextAction);

      this.emit('decision', {
        action: decision.nextAction,
        reasoning: decision.reasoning,
        actionHistory: state.actionHistory
      });

      // Execute action
      const actionSuccess = await this.executeAction(decision.nextAction, state);
      
      if (!actionSuccess) {
        this.emit('error', { message: `Action ${decision.nextAction} failed` });
        break;
      }

      // Check if done
      if (decision.nextAction === AgentAction.DONE) {
        Logger.header('TASK COMPLETED');
        this.emit('complete', { 
          state,
          iterations: state.iterations 
        });
        this.displayFinalOutput(state);
        break;
      }
    }

    if (state.iterations >= this.maxIterations) {
      Logger.error('System', 'Max iterations reached');
      // Still emit complete if we have code, so the UI shows something useful
      if (state.code) {
        this.emit('complete', { 
          state,
          iterations: state.iterations,
          note: 'Completed at iteration limit'
        });
        this.displayFinalOutput(state);
      } else {
        this.emit('max_iterations', { state });
      }
    }
  }

  private async executeAction(action: AgentAction, state: SystemState): Promise<boolean> {
    switch (action) {
      case AgentAction.PLAN:
      case AgentAction.REFINE_PLAN: {
        const response = await this.planner.createPlan(state);
        if (response.success && response.data) {
          state.plan = response.data;
          this.emit('plan', response.data);
          return true;
        }
        return false;
      }

      case AgentAction.RESEARCH: {
        const response = await this.researcher.research(state);
        if (response.success && response.data) {
          state.research = response.data;
          this.emit('research', response.data);
          return true;
        }
        return false;
      }

      case AgentAction.CODE: {
        const response = await this.coder.generateCode(state);
        if (response.success && response.data) {
          state.code = response.data;
          this.emit('code', response.data);
          
          if (state.plan && state.currentStep < state.plan.steps.length) {
            state.plan.steps[state.currentStep].status = 'completed';
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
          this.emit('review', response.data);
          
          if (response.data.improvedCode) {
            state.code = response.data.improvedCode;
          }
          
          return true;
        }
        return false;
      }

      case AgentAction.DONE:
        return true;

      default:
        return false;
    }
  }

  private displayFinalOutput(state: SystemState): void {
    // Keep existing implementation
    Logger.divider();
    
    if (state.code) {
      Logger.agent('System', 'Generated Code:');
      state.code.files.forEach(file => {
        Logger.success('System', `File: ${file.filename}`);
        console.log('```' + file.language);
        console.log(file.content);
        console.log('```\n');
      });
    }
  }
}

// CLI mode
if (require.main === module) {
  const system = new MultiAgentSystem();
  const userInput = process.argv[2] || 
    "Build a REST API for an expense tracker with user authentication";
  
  system.run(userInput).catch(console.error);
}