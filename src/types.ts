export enum AgentAction {
  PLAN = 'PLAN',
  RESEARCH = 'RESEARCH',
  CODE = 'CODE',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  REFINE_PLAN = 'REFINE_PLAN'
}

export interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  output?: string;
}

export interface Plan {
  steps: TaskStep[];
  overallGoal: string;
}

export interface ResearchOutput {
  bestPractices: string[];
  recommendations: string[];
  architectureNotes: string;
}

export interface CodeOutput {
  files: Array<{
    filename: string;
    content: string;
    language: string;
  }>;
  explanation: string;
}

export interface ReviewOutput {
  issues: string[];
  improvements: string[];
  rating: number; // 1-10
  improvedCode?: CodeOutput;
  shouldRevise: boolean;
}

export interface SystemState {
  userInput: string;
  plan?: Plan;
  research?: ResearchOutput;
  code?: CodeOutput;
  reviews: ReviewOutput[];
  currentStep: number;
  iterations: number;
  actionHistory: AgentAction[];
  conversationContext: string[];
}

export interface OrchestratorDecision {
  nextAction: AgentAction;
  reasoning: string;
  targetStep?: string;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}