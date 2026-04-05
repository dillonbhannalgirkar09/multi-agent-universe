// src/services/llm.ts - Fixed TypeScript types for OpenAI
import OpenAI from 'openai';
import { Logger } from '../utils/logger';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class LLMService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: 4096,
        messages: messages,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      Logger.error('LLM', `OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async chatJSON<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.chat(prompt, systemPrompt);

    try {
      // Extract JSON from ```json blocks or plain JSON
      const jsonMatch = response.match(/```(?:json)?\n?([\s\S]*?)```/) ||
                       response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      Logger.error('LLM', 'Failed to parse JSON from OpenAI response');
      Logger.info(`Raw response:\n${response}`);
      throw new Error(`Invalid JSON: ${parseError}`);
    }
  }
}