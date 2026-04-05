import { LLMService } from '../services/llm';
import { PromptTemplates } from '../utils/prompts';
import { Logger } from '../utils/logger';
import { SystemState, CodeOutput, AgentResponse } from '../types';

export class CoderAgent {
  constructor(private llm: LLMService) {}

  async generateCode(state: SystemState): Promise<AgentResponse<CodeOutput>> {
    try {
      Logger.agent('Coder', 'Generating code...');
      
      const prompt = PromptTemplates.coder(state);
      const code = await this.llm.chatJSON<CodeOutput>(prompt);

      Logger.success('Coder', `Generated ${code.files.length} file(s)`);
      code.files.forEach(file => {
        Logger.info(`  - ${file.filename} (${file.language})`);
      });

      return {
        success: true,
        data: code
      };
    } catch (error) {
      Logger.error('Coder', `Code generation failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}