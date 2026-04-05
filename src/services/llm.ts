import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger';

export class LLMService {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      Logger.error('LLM', `Error calling Claude API: ${error}`);
      throw error;
    }
  }

  async chatJSON<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.chat(prompt, systemPrompt);
    
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/```\n([\s\S]*?)\n```/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      Logger.error('LLM', `Error parsing JSON response: ${error}`);
      Logger.info(`Raw response: ${response}`);
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}