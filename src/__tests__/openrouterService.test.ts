import { callOpenRouter } from '../services/openrouterService';
import { vi } from 'vitest';

describe('openrouterService', () => {
  const fakeKey = 'FAKE_OPENROUTER_KEY';

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('API_KEY_OPENROUTER', fakeKey);
    localStorage.setItem('API_URL_OPENROUTER', 'https://openrouter.ai/api/v1/chat/completions');
  });

  it('throws if API key is missing', async () => {
    localStorage.removeItem('API_KEY_OPENROUTER');
    await expect(callOpenRouter('test')).rejects.toThrow('Clé API manquante pour OPENROUTER');
  });

  it('calls fetch with correct payload and returns content', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Mock answer' } }],
    } as any;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    // @ts-ignore – replace global fetch for the test
    vi.spyOn(global, 'fetch').mockImplementation(fetchMock);

    const result = await callOpenRouter('Hello world', { model: 'mymodel' });

    expect(fetchMock).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${fakeKey}`,
        'Content-Type': 'application/json',
      },
    }));

    const calledBody = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(calledBody.model).toBe('mymodel');
    expect(calledBody.messages[0].content).toBe('Hello world');
    expect(result).toBe('Mock answer');
  });
});
