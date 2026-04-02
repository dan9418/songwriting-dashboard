"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface RouteProgressContextValue {
  start: () => void;
}

const RouteProgressContext = createContext<RouteProgressContextValue>({
  start: () => {}
});

function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function RouteProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const hasMountedRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const startedAtRef = useRef(0);
  const trickleTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const failSafeTimerRef = useRef<number | null>(null);

  const stopTrickle = useCallback(() => {
    clearTimer(trickleTimerRef);
  }, []);

  const finish = useCallback(() => {
    clearTimer(failSafeTimerRef);
    stopTrickle();
    setProgress(100);
    clearTimer(hideTimerRef);
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 180);
  }, [stopTrickle]);

  const start = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    clearTimer(hideTimerRef);
    clearTimer(failSafeTimerRef);
    setVisible(true);
    setProgress((current) => (current > 12 ? current : 12));
    isNavigatingRef.current = true;
    startedAtRef.current = Date.now();

    stopTrickle();
    trickleTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) {
          return current;
        }
        return current + Math.max((96 - current) * 0.1, 1.2);
      });
    }, 160);

    failSafeTimerRef.current = window.setTimeout(() => {
      isNavigatingRef.current = false;
      finish();
    }, 10000);
  }, [finish, stopTrickle]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = false;
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(140 - elapsed, 0);

    if (remaining === 0) {
      finish();
      return;
    }

    clearTimer(hideTimerRef);
    hideTimerRef.current = window.setTimeout(() => {
      finish();
    }, remaining);
  }, [finish, pathname, search]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.href;
      if (!href) {
        return;
      }

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const nextPathWithSearch = `${nextUrl.pathname}${nextUrl.search}`;
      const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;

      if (nextPathWithSearch === currentPathWithSearch) {
        return;
      }

      start();
    }

    function onPopState() {
      start();
    }

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimer(failSafeTimerRef);
      clearTimer(hideTimerRef);
      stopTrickle();
    };
  }, [start, stopTrickle]);

  return (
    <RouteProgressContext.Provider value={{ start }}>
      <div className="route-progress" data-visible={visible}>
        <span className="route-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      {children}
    </RouteProgressContext.Provider>
  );
}

export function useProgressRouter() {
  const router = useRouter();
  const { start } = useContext(RouteProgressContext);

  return {
    ...router,
    push(href: Parameters<typeof router.push>[0], options?: Parameters<typeof router.push>[1]) {
      start();
      router.push(href, options);
    },
    replace(href: Parameters<typeof router.replace>[0], options?: Parameters<typeof router.replace>[1]) {
      start();
      router.replace(href, options);
    },
    back() {
      start();
      router.back();
    },
    forward() {
      start();
      router.forward();
    }
  };
}
