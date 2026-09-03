import { useState, useCallback, useRef } from 'react';

interface UndoRedoHistory<T> {
  past: T[];
  present: T;
  future: T[];
}

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 300;

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<UndoRedoHistory<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPresentRef = useRef<T | null>(null);

  const setState = useCallback(
    (newStateOrUpdater: T | ((prev: T) => T)) => {
      setHistory((prev) => {
        const newState =
          typeof newStateOrUpdater === 'function'
            ? (newStateOrUpdater as (prev: T) => T)(prev.present)
            : newStateOrUpdater;

        // If nothing changed, don't push to history
        if (newState === prev.present) return prev;

        // Debounce: if we have a pending present, we group rapid changes
        // by not pushing intermediate states. We only push the *first* present
        // before a rapid sequence as the undo checkpoint.
        if (debounceTimerRef.current !== null) {
          // We are in a debounce window: update present without pushing to past
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            pendingPresentRef.current = null;
          }, DEBOUNCE_MS);

          return {
            past: prev.past,
            present: newState,
            future: [], // clear redo on new change
          };
        }

        // Start a new debounce window
        pendingPresentRef.current = prev.present;
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          pendingPresentRef.current = null;
        }, DEBOUNCE_MS);

        const newPast = [...prev.past, prev.present];
        if (newPast.length > MAX_HISTORY) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: newState,
          future: [],
        };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
