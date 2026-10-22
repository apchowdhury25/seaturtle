import type { Page } from "@playwright/test";

export async function hideCookieBar(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("sta_cookie", "rejected");
  });
}

/** Elements that paint past the viewport and are not inside an intentional horizontal scroller. */
export async function horizontalOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const offenders: Element[] = [];
    for (const el of document.body.querySelectorAll("*")) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      if (rect.right <= window.innerWidth + 1 && rect.left >= -1) continue;
      const position = getComputedStyle(el).position;
      if (position === "fixed" || position === "sticky") continue;
      let parent = el.parentElement;
      let scroller = false;
      while (parent) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow === "auto" || overflow === "scroll") {
          scroller = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!scroller) offenders.push(el);
    }
    const top = offenders.filter((el) => !offenders.some((other) => other !== el && other.contains(el)));
    return top.slice(0, 6).map((el) => {
      const label = el.getAttribute("aria-label");
      return `${el.tagName.toLowerCase()}${label ? ` ${label}` : ""}`.slice(0, 120);
    });
  });
}
