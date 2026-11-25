import { useEffect, useState } from "react";

/**
 * Current time (ms) that re-renders the component every `intervalMs`. Use instead of calling
 * Date.now() during render, which is impure and goes stale while the screen stays open.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
