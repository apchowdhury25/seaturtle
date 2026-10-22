"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";

const CHANGE = "sta-cookie";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot() {
  try {
    return window.localStorage.getItem("sta_cookie") ?? "";
  } catch {
    return "rejected";
  }
}

function serverSnapshot() {
  return "pending";
}

export function CookieNotice() {
  const choice = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = bar.current;
    if (!node) {
      document.documentElement.style.removeProperty("--cookie-bar");
      return;
    }
    const apply = () => document.documentElement.style.setProperty("--cookie-bar", `${node.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cookie-bar");
    };
  }, [choice]);
  if (choice !== "") return null;
  function choose(value: "accepted" | "rejected") {
    window.localStorage.setItem("sta_cookie", value);
    window.dispatchEvent(new Event(CHANGE));
  }
  return (
    <div ref={bar} className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(14,36,51,0.08)]" role="dialog" aria-labelledby="cookie-title">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p id="cookie-title" className="font-display text-lg text-navy">Cookies</p>
          <p className="max-w-2xl text-sm text-muted">The cart cookie is essential. Optional analytics stay off unless you accept them. <Link href="/cookies" className="underline">Cookie preferences</Link></p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
          <button type="button" className="min-h-11 border border-navy px-3 text-sm" onClick={() => choose("rejected")}>Reject optional</button>
          <button type="button" className="min-h-11 bg-navy px-3 text-sm text-ivory" onClick={() => choose("accepted")}>Accept optional</button>
        </div>
      </div>
    </div>
  );
}
