type ScreenExtended = Screen & {
  isExtended?: boolean;
  addEventListener?: (type: "change", fn: () => void) => void;
  removeEventListener?: (type: "change", fn: () => void) => void;
};

type KeyboardLock = {
  lock: (keys?: string[]) => Promise<void>;
  unlock: () => void;
};

export function isExtendedDisplay(): boolean {
  try {
    return Boolean((window.screen as ScreenExtended).isExtended);
  } catch {
    return false;
  }
}

export function onDisplayChange(fn: () => void): () => void {
  const screen = window.screen as ScreenExtended;
  screen.addEventListener?.("change", fn);
  window.addEventListener("resize", fn);
  return () => {
    screen.removeEventListener?.("change", fn);
    window.removeEventListener("resize", fn);
  };
}

export async function enterFullscreen(el: HTMLElement): Promise<boolean> {
  try {
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
      } catch {
        await el.requestFullscreen();
      }
    }
    const kb = (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
    if (kb?.lock) {
      await kb.lock(["Escape", "Tab", "F11", "MetaLeft", "MetaRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight"]);
    }
    return Boolean(document.fullscreenElement);
  } catch {
    return Boolean(document.fullscreenElement);
  }
}

export function releaseQuizLock() {
  const kb = (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
  try {
    kb?.unlock();
  } catch {
    /* ignore */
  }
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined);
  }
}

/** Browser back/forward (including Mac trackpad swipe-between-pages). */
export function trapHistory(): () => void {
  const url = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  history.pushState({ quizLock: true }, "", url);
  const onPop = () => {
    history.pushState({ quizLock: true }, "", url);
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}

/** Block in-page swipe navigation. Cannot disable Mission Control itself. */
export function blockPageSwipes(el: HTMLElement, onSwipe: () => void): () => void {
  const wheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) > 12 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      onSwipe();
    }
  };
  const gesture = (e: Event) => {
    e.preventDefault();
  };
  el.style.overscrollBehaviorX = "none";
  document.documentElement.style.overscrollBehaviorX = "none";
  document.body.style.overscrollBehaviorX = "none";
  window.addEventListener("wheel", wheel, { passive: false, capture: true });
  window.addEventListener("gesturestart", gesture, { passive: false, capture: true });
  window.addEventListener("gesturechange", gesture, { passive: false, capture: true });
  return () => {
    window.removeEventListener("wheel", wheel, true);
    window.removeEventListener("gesturestart", gesture, true);
    window.removeEventListener("gesturechange", gesture, true);
    el.style.overscrollBehaviorX = "";
    document.documentElement.style.overscrollBehaviorX = "";
    document.body.style.overscrollBehaviorX = "";
  };
}
