import { vi } from 'vitest';
import { fetchBooks, saveBook, fetchDailyData, saveDaily, logAIRequest } from '../api/insforge';

const mockFetch = (data: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });

describe('API client (insforge)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchBooks calls GET /api/books', async () => {
    const books = [{ id: '1', title: 'Test Book' }];
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch(books));
    const result = await fetchBooks();
    expect(result).toEqual(books);
  });

  it('saveBook sends POST for new book', async () => {
    const book = { title: 'New Book' };
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch({ id: 'new', ...book }));
    const result = await saveBook(book);
    expect(result.id).toBe('new');
  });

  it('saveBook sends PUT for existing book', async () => {
    const book = { id: '1', title: 'Updated Book' };
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch(book));
    const result = await saveBook(book);
    expect(result.title).toBe('Updated Book');
  });

  it('fetchDailyData calls GET /api/daily', async () => {
    const data = [{ day_number: 1 }];
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch(data));
    const result = await fetchDailyData();
    expect(result).toEqual(data);
  });

  it('saveDaily sends POST with data', async () => {
    const payload = { day_number: 1, prayer_hours: 4 };
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch({ id: 1, ...payload }));
    const result = await saveDaily(payload);
    expect(result.day_number).toBe(1);
  });

  it('logAIRequest sends POST', async () => {
    const payload = { provider: 'OpenRouter', prompt: 'test' };
    vi.spyOn(global, 'fetch').mockImplementation(mockFetch({ id: 'req_1' }));
    const result = await logAIRequest(payload);
    expect(result.id).toBe('req_1');
  });
});
