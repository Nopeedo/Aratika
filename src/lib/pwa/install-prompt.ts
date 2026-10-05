/**
 * The stashed `beforeinstallprompt` event.
 *
 * Chrome fires `beforeinstallprompt` ONCE, early — as soon as it has the
 * manifest and a service worker. On a repeat visit, where both are already
 * cached, that can land before React has hydrated the homepage. A listener
 * added in a `useEffect` is added after hydration, so it misses the event, and
 * the install card then hides itself ("not installable here") on a browser that
 * was offering to install it a moment earlier.
 *
 * The fix is a listener that exists before hydration: a tiny inline script in
 * the root layout (see layout.tsx) stashes the event on `window` under the name
 * below. Components read the stash on mount AND keep their own listener, so the
 * event is caught whichever side of hydration it arrives on.
 *
 * This module exists so the global's name and shape are declared once. Two
 * components read it, and a typo in a string literal on either side would fail
 * silently — there is nothing to throw when a property is simply undefined.
 */

/** The useful half of the event: everything else on it we ignore. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

/** Must match the name used by the inline script in src/app/layout.tsx. */
export const INSTALL_STASH = '__pkInstall' as const

interface Stash { event: InstallPromptEvent | null }

/** The event if the browser fired it before this component mounted, else null. */
export function stashedInstallPrompt(): InstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, Stash | undefined>
  return w[INSTALL_STASH]?.event ?? null
}

/**
 * The inline script, as source. Lives here next to the reader so the two cannot
 * drift apart. It must stay small, synchronous and unable to throw: it runs
 * before anything else on the page.
 */
export const INSTALL_STASH_SCRIPT = `(function(){try{
var s=window.${INSTALL_STASH}={event:null};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();s.event=e;});
window.addEventListener('appinstalled',function(){s.event=null;});
}catch(e){}})();`
