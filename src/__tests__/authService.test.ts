import { authService } from '../services/authService';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null token when not authenticated', () => {
    expect(authService.getToken()).toBeNull();
  });

  it('signOut removes the token', () => {
    localStorage.setItem('authToken', 'some-token');
    expect(authService.getToken()).toBe('some-token');
    authService.signOut();
    expect(authService.getToken()).toBeNull();
  });

  it('checkSession returns false when not authenticated', async () => {
    const result = await authService.checkSession();
    expect(result).toBe(false);
  });
});
