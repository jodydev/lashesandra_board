// Temporary lightweight React/JSX shims.
// This repo currently lacks @types/react; these declarations keep TS tooling usable.

declare module 'react' {
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);

  export function useState<S>(initialState: S): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;

  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare namespace React {
  // Minimal surface used in a few props types across the app
  type MouseEvent<T = any> = any;
  type TouchEvent<T = any> = any;
  type ChangeEvent<T = any> = any;
  type FormEvent<T = any> = any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

