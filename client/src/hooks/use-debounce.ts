import * as React from "react";

export function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
) {
  const callbackRef = React.useRef(callback);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = React.useCallback(() => clearTimeout(timeoutRef.current), []);

  const debounced = React.useCallback(
    (...args: Args) => {
      cancel();
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), wait);
    },
    [wait, cancel],
  );

  React.useEffect(() => cancel, [cancel]);

  return [debounced, cancel] as const;
}
