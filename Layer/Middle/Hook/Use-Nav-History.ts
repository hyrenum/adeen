// Layer/Middle/Hook/Use-Nav-History.ts
// Singleton in-memory navigation history for de-duplicated "back" behavior.
//
// We track every distinct path the user lands on (consecutive duplicates are
// collapsed). When the user clicks Back, we pop entries off the stack until
// we find one that differs from the current path, then return it.
// If nothing remains, the caller can fall back to URL-segment climbing.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const stack: string[] = [];

export const navHistory = {
  push(path: string) {
    // Skip if same as top (consecutive duplicate)
    if (stack[stack.length - 1] === path) return;
    // Also skip A→B→A patterns: if path equals 2-back, drop the previous entry
    // (treats A→B→A as if user undid B, so back goes to A's predecessor)
    if (stack.length >= 2 && stack[stack.length - 2] === path) {
      stack.pop();
      return;
    }
    stack.push(path);
    if (stack.length > 100) stack.splice(0, stack.length - 100);
  },
  /**
   * Pop entries equal to currentPath, then return the next distinct path
   * (also popping it). Returns null if nothing distinct remains.
   */
  popDistinct(currentPath: string): string | null {
    // Drop the current entry (and any consecutive duplicates) from the top.
    while (stack.length && stack[stack.length - 1] === currentPath) {
      stack.pop();
    }
    // Drop further consecutive duplicates of each other while different from current.
    while (stack.length >= 2 && stack[stack.length - 1] === stack[stack.length - 2]) {
      stack.pop();
    }
    const next = stack.pop();
    return next && next !== currentPath ? next : null;
  },
  size() {
    return stack.length;
  },
};

/** Mount once near the router root to record visits. */
export function useNavHistoryTracker() {
  const location = useLocation();
  useEffect(() => {
    navHistory.push(location.pathname);
  }, [location.pathname]);
}
