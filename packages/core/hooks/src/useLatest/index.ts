import { useRef } from 'react';

/** Always returns a ref holding the latest value, avoiding stale closures. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export default useLatest;
