import { authService } from '../services/authService';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null token when not authenticated', () => {
    expect(authService.getToken()).toBeNull();
  });

  it('signInWithEmail stores a token', async () => {
    const result = await authService.signInWithEmail('test@example.com');
    expect(result.token).toBeTruthy();
    expect(authService.getToken()).toBe(result.token);
  });

  it('signInWithGoogle stores a token', async () => {
    const result = await authService.signInWithGoogle();
    expect(result.token).toBeTruthy();
    expect(result.user.provider).toBe('google');
  });

  it('signOut removes the token', async () => {
    await authService.signInWithEmail('test@example.com');
    expect(authService.getToken()).toBeTruthy();
    authService.signOut();
    expect(authService.getToken()).toBeNull();
  });
});
