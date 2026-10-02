import * as React from "react";

export function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
) {
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  const debounced = React.useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => clearTimeout(timeout);
    const run = (...args: Args) => {
      cancel();
      timeout = setTimeout(() => callbackRef.current(...args), wait);
    };
    return Object.assign(run, { cancel });
  }, [wait]);

  React.useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
