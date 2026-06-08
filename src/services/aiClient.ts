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

interface ProviderConfig {
  url: string;
  key: string;
  model: string;
}

function loadConfig(provider: string): ProviderConfig {
  const key = provider.toUpperCase();
  return {
    url: localStorage.getItem(`API_URL_${key}`) || PROVIDERS[provider as ProviderName]?.endpoint || '',
    key: localStorage.getItem(`API_KEY_${key}`) || '',
    model: localStorage.getItem(`API_MODEL_${key}`) || '',
  };
}

const DEFAULT_MODELS: Record<string, string> = {
  GEMINI: 'gemini-pro',
  DEEPSEEK: 'deepseek-v4-flash',
  OPENROUTER: 'openai/gpt-4o',
  FIREWORKS: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
};

export class AIClient {
  private endpoint: string;
  private apiKey: string;
  private model: string;
  private providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName.toUpperCase();
    const config = loadConfig(providerName);
    this.endpoint = config.url;
    this.apiKey = config.key;
    this.model = config.model || DEFAULT_MODELS[this.providerName] || '';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.endpoint) throw new Error(`URL non configurée pour ${this.providerName}.`);
    if (!this.apiKey) throw new Error(`Clé API manquante pour ${this.providerName}.`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(this.formatPayload(prompt)),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`${this.providerName} error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return this.extractResponse(data);
  }

  private formatPayload(prompt: string) {
    if (this.endpoint.includes('googleapis.com')) {
      return { contents: [{ parts: [{ text: prompt }] }] };
    }
    return {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    };
  }

  private extractResponse(data: any): string {
    if (data.candidates) return data.candidates[0].content.parts[0].text;
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    throw new Error(`Format de réponse non reconnu pour ${this.providerName}`);
  }
}

export async function testConnection(provider: string): Promise<string> {
  const client = new AIClient(provider);
  return client.generate('Réponds uniquement "ok" si tu reçois ce message.');
}
