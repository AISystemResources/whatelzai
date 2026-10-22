"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Download, Smartphone } from "lucide-react";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const Installation = createContext<{
  prompt: InstallPrompt | null;
  installed: boolean;
  ios: boolean;
  clear: () => void;
}>({ prompt: null, installed: false, ios: false, clear: () => {} });

function browserInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
function subscribeDisplay(callback: () => void) {
  const display = window.matchMedia("(display-mode: standalone)");
  display.addEventListener("change", callback);
  return () => display.removeEventListener("change", callback);
}
const subscribePlatform = () => () => {};
const serverFalse = () => false;
function browserIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
export function AppInstallationProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    browserInstalled,
    serverFalse,
  );
  const ios = useSyncExternalStore(subscribePlatform, browserIos, serverFalse);
  const installed = standalone || justInstalled;
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const completed = () => {
      setJustInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", completed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", completed);
    };
  }, []);
  return (
    <Installation.Provider
      value={{ prompt, installed, ios, clear: () => setPrompt(null) }}
    >
      {children}
    </Installation.Provider>
  );
}

export function InstallAppCard() {
  const { prompt, installed, ios, clear } = useContext(Installation);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Installation requested. Look for fcOS on your home screen or in your apps."
          : "You can install fcOS whenever you’re ready.",
      );
    } catch {
      setMessage(
        "Use your browser menu to install fcOS, or reload this page to try again.",
      );
    } finally {
      clear();
      setBusy(false);
    }
  }
  return (
    <section
      className="rounded-3xl border p-6"
      aria-labelledby="install-fcos-title"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-yellow-300 p-3">
          <Smartphone size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id="install-fcos-title" className="text-xl font-semibold">
            fcOS on your phone
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Your workspace, one tap away.
          </p>
        </div>
      </div>
      {installed ? (
        <p className="mt-4 text-sm">You’re using the installed fcOS app.</p>
      ) : (
        <>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            Add fcOS to your home screen for its own app window. No app store
            needed. An internet connection is required.
          </p>
          {prompt && !ios ? (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-semibold disabled:opacity-50"
            >
              <Download size={18} aria-hidden="true" />
              {busy ? "Opening installer…" : "Install fcOS"}
            </button>
          ) : null}
          <details className="mt-4" open={ios || !prompt}>
            <summary className="cursor-pointer text-sm font-medium">
              {ios ? "Install on iPhone or iPad" : "How to install"}
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-600">
              {ios ? (
                <>
                  <li>Open app.whatelz.ai in Safari.</li>
                  <li>
                    Tap Share, then Add to Home Screen (you may need to scroll).
                  </li>
                  <li>Keep Open as Web App enabled if shown, then tap Add.</li>
                </>
              ) : (
                <>
                  <li>
                    On Android, open app.whatelz.ai in Chrome, then open the ⋮
                    menu.
                  </li>
                  <li>
                    Choose Add to Home screen or Install app, then confirm.
                  </li>
                  <li>
                    On a computer, use the install icon in the address bar, or
                    your browser’s install menu.
                  </li>
                </>
              )}
            </ol>
          </details>
        </>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-zinc-600">
          {message}
        </p>
      )}
    </section>
  );
}
