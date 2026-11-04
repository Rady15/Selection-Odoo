import { useEffect, useRef } from 'react';

/**
 * Runs `callback` immediately and then every `intervalMs` milliseconds.
 * Polling pauses while the tab is hidden to avoid useless background requests.
 * Pass `enabled={false}` to disable the timer (e.g. no logged-in user).
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
 const cbRef = useRef(callback);
 cbRef.current = callback;

 useEffect(() => {
 if (!enabled) return;

 cbRef.current();

 let timer: ReturnType<typeof setInterval> | null = null;
 const start = () => {
 if (timer) return;
 timer = setInterval(() => {
 if (!document.hidden) cbRef.current();
 }, intervalMs);
 };
 const stop = () => {
 if (timer) {
 clearInterval(timer);
 timer = null;
 }
 };
 const onVisibilityChange = () => {
 if (document.hidden) {
 stop();
 } else {
 cbRef.current();
 start();
 }
 };

 start();
 document.addEventListener('visibilitychange', onVisibilityChange);

 return () => {
 stop();
 document.removeEventListener('visibilitychange', onVisibilityChange);
 };
 }, [intervalMs, enabled]);
}
