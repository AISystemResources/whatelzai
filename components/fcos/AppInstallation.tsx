"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Download, X } from "lucide-react";

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
    // Older Chromium install promotion requires a fetch-capable worker.
    // This worker is network-only; browser-menu installation remains the fallback.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/fcos-sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
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

export function InstallAppButton({
  accent = "yellow",
}: {
  accent?: "yellow" | "orange";
}) {
  const buttonTone =
    accent === "orange"
      ? "bg-orange-500 text-white"
      : "bg-yellow-300 text-zinc-950";
  const { prompt, installed, ios, clear } = useContext(Installation);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const help = useRef<HTMLDialogElement>(null);
  async function install() {
    if (busy) return;
    if (!prompt || ios) {
      help.current?.showModal();
      return;
    }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(
        choice.outcome === "accepted" ? "Installation requested." : "",
      );
    } catch {
      help.current?.showModal();
    } finally {
      clear();
      setBusy(false);
    }
  }
  if (installed) return null;
  return (
    <div>
      <button
        type="button"
        onClick={install}
        disabled={busy}
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-50 ${buttonTone}`}
      >
        <Download size={18} aria-hidden="true" />
        {busy ? "Opening installer…" : "Install fcOS"}
      </button>
      {message && (
        <p role="status" className="mt-2 text-sm text-zinc-500">
          {message}
        </p>
      )}
      <dialog
        ref={help}
        aria-labelledby="fcos-install-help"
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="fcos-install-help" className="text-xl font-semibold">
            Add fcOS to your phone
          </h2>
          <button
            type="button"
            aria-label="Close install instructions"
            onClick={() => help.current?.close()}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          {ios ? (
            <>
              In Safari, tap <strong>Share → Add to Home Screen</strong>, then{" "}
              <strong>Add</strong>. Keep <strong>Open as Web App</strong>{" "}
              enabled if shown.
            </>
          ) : (
            <>
              In Chrome, open <strong>⋮ → Add to Home screen → Install</strong>.
              On a computer, use the install icon in the address bar or your
              browser’s install menu.
            </>
          )}
        </p>
        <form method="dialog" className="mt-5">
          <button
            className={`w-full rounded-xl px-4 py-3 font-semibold ${buttonTone}`}
          >
            Got it
          </button>
        </form>
      </dialog>
    </div>
  );
}
