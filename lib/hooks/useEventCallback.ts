import { useCallback } from 'react'

export function useEventCallback<T extends (...args: any[]) => void>(callback: T): T {
  return useCallback(callback, []) as T
}
