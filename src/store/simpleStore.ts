import { useSyncExternalStore } from 'react';

type Listener = () => void;

type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T> | T),
  replace?: boolean,
) => void;

type GetState<T> = () => T;

export interface StoreApi<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener) => () => void;
}

const readPersistedState = <T,>(storageKey?: string): Partial<T> | null => {
  if (!storageKey) return null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: Partial<T> };
    return parsed.state ?? null;
  } catch {
    return null;
  }
};

const writePersistedState = <T,>(storageKey: string | undefined, state: T) => {
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify({ state, version: 0 }));
  } catch {
    // Ignore persistence failures in private mode or test environments.
  }
};

export function createStore<T>(
  initializer: (set: SetState<T>, get: GetState<T>) => T,
  options: { storageKey?: string } = {},
) {
  let state: T;
  const listeners = new Set<Listener>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial, replace = false) => {
    const nextState =
      typeof partial === 'function' ? partial(state) : partial;

    state = replace
      ? (nextState as T)
      : ({ ...state, ...nextState } as T);

    writePersistedState(options.storageKey, state);
    listeners.forEach(listener => listener());
  };

  const baseState = initializer(setState, getState);
  const persistedState = readPersistedState<T>(options.storageKey);

  state = persistedState ? ({ ...baseState, ...persistedState } as T) : baseState;
  writePersistedState(options.storageKey, state);

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useBoundStore = () => useSyncExternalStore(subscribe, getState, getState);

  return Object.assign(useBoundStore, {
    getState,
    setState,
    subscribe,
  });
}
