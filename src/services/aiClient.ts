export type ProviderName = 'Gemini' | 'DeepSeek' | 'OpenRouter' | 'Fireworks';

export interface AIProvider {
  name: ProviderName;
  endpoint: string;
}

export const PROVIDERS: Record<ProviderName, AIProvider> = {
  Gemini: { name: 'Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent' },
  DeepSeek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions' },
  OpenRouter: { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
  Fireworks: { name: 'Fireworks', endpoint: 'https://api.fireworks.ai/inference/v1/chat/completions' },
};

export class AIClient {
  private endpoint: string;
  private apiKey: string;

  constructor(providerName: string) {
    this.endpoint = localStorage.getItem(`API_URL_${providerName.toUpperCase()}`) || '';
    this.apiKey = localStorage.getItem(`API_KEY_${providerName.toUpperCase()}`) || '';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.endpoint || !this.apiKey) throw new Error(`Configuration incomplète pour le provider.`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(this.formatPayload(prompt)),
    });

    const data = await response.json();
    return this.extractResponse(data);
  }

  private formatPayload(prompt: string) {
    const isGemini = this.endpoint.includes('googleapis.com');

    if (isGemini) {
      return {
        contents: [{ parts: [{ text: prompt }] }],
      };
    }

    return {
      model: this.getModelName(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    };
  }

  private getModelName(): string {
    if (this.endpoint.includes('deepseek.com')) return 'deepseek-chat';
    if (this.endpoint.includes('openrouter.ai')) return 'openai/gpt-4o';
    if (this.endpoint.includes('fireworks.ai')) return 'accounts/fireworks/models/llama-v3p1-8b-instruct';
    return 'gemini-pro';
  }

  private extractResponse(data: any): string {
    if (data.candidates) {
      return data.candidates[0].content.parts[0].text;
    }
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || '';
    }
    throw new Error('Format de réponse IA non reconnu');
  }
}
