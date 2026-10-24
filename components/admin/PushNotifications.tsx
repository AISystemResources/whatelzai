"use client";
import Link from "@/components/admin/AdminLink";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { adminUrl } from "@/lib/admin-url";

type Config = {
  configured: boolean;
  publicKey: string | null;
  monitor: { checked_at: string; error_code: string | null } | null;
};
type State = {
  supported: boolean;
  iosInstall: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  config: Config | null;
  error: string | null;
  errorCode?: string | null;
};
const api = "/api/admin/push";
async function post(action: string, body: Record<string, unknown>) {
  const response = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Notifications are unavailable.");
  return data;
}
function keyBytes(key: string) {
  const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
async function worker() {
  const registration = await navigator.serviceWorker.register("/admin-sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await navigator.serviceWorker.ready;
  const installing = registration.installing;
  if (installing && installing.state !== "activated") {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        installing.removeEventListener("statechange", changed);
        reject(
          Error(
            "The app update is taking longer than expected. Reopen Settings and retry.",
          ),
        );
      }, 15000);
      const changed = () => {
        if (
          installing.state === "activated" ||
          installing.state === "redundant"
        ) {
          clearTimeout(timeout);
          installing.removeEventListener("statechange", changed);
          if (installing.state === "activated") resolve();
          else reject(Error("The notification worker could not start."));
        }
      };
      installing.addEventListener("statechange", changed);
      changed();
    });
  }
  return registration;
}
export function PushNotifications() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const installed =
        matchMedia("(display-mode: standalone)").matches ||
        !!(navigator as Navigator & { standalone?: boolean }).standalone;
      const ios =
        /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const supported =
        window.isSecureContext &&
        "Notification" in window &&
        "PushManager" in window &&
        "serviceWorker" in navigator;
      const initial: State = {
        supported,
        iosInstall: ios && !installed,
        permission:
          "Notification" in window ? Notification.permission : "default",
        enabled: false,
        config: null,
        error: null,
      };
      try {
        const response = await fetch(api, { cache: "no-store" });
        if (!response.ok)
          throw Error("Notification settings could not be loaded.");
        initial.config = await response.json();
        if (supported && !initial.iosInstall) {
          const registration =
            await navigator.serviceWorker.getRegistration("/");
          const subscription =
            await registration?.pushManager.getSubscription();
          if (subscription) {
            const status = await post("status", {
              endpoint: subscription.endpoint,
            });
            initial.enabled =
              status.enabled && initial.permission === "granted";
            initial.errorCode = status.errorCode;
          }
        }
      } catch (error) {
        initial.error =
          error instanceof Error
            ? error.message
            : "Notification status is unavailable.";
      }
      if (!cancelled) setState(initial);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  async function enable() {
    if (!state?.config?.publicKey) return;
    setBusy(true);
    setMessage("");
    try {
      // Must happen immediately inside this tap; do not fetch/register first on iOS.
      const permission = await Notification.requestPermission();
      setState((old) => (old ? { ...old, permission } : old));
      if (permission !== "granted") {
        setMessage(
          permission === "denied"
            ? "Notifications are blocked. Allow Whatelz Admin in your device’s notification settings, then reopen the app."
            : "Permission wasn’t enabled. You can try again when you’re ready.",
        );
        return;
      }
      const registration = await worker();
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && state.errorCode === "expired") {
        await subscription.unsubscribe();
        subscription = null;
      }
      const expected = keyBytes(state.config.publicKey);
      const existing = subscription?.options.applicationServerKey;
      if (
        subscription &&
        existing &&
        (existing.byteLength !== expected.byteLength ||
          !new Uint8Array(existing).every((v, i) => v === expected[i]))
      ) {
        await subscription.unsubscribe();
        subscription = null;
      }
      const created = !subscription;
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expected,
      });
      try {
        await post("subscribe", { subscription: subscription.toJSON() });
      } catch (error) {
        if (created) await subscription.unsubscribe();
        throw error;
      }
      setState((old) =>
        old ? { ...old, enabled: true, error: null, errorCode: null } : old,
      );
      setMessage("Enabled on this device. Send a test to check delivery.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not enable notifications.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await post("unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setState((old) => (old ? { ...old, enabled: false } : old));
      setMessage("Disabled on this device.");
    } catch {
      setMessage(
        "Could not disable notifications. Please retry before closing this page.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) throw Error("This device needs to be enabled again.");
      await post("test", { endpoint: subscription.endpoint });
      setMessage(
        "Test accepted by the push service. Check your notifications; device settings and Focus mode can affect delivery.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Test could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }
  const status = !state
    ? "Checking this device…"
    : state.iosInstall
      ? "Open your installed app to enable"
      : !state.supported
        ? "Not supported in this browser"
        : state.error
          ? "Status unavailable"
          : state.enabled
            ? "Enabled on this device"
            : state.permission === "denied"
              ? "Blocked in device settings"
              : "Not enabled on this device";
  return (
    <section
      aria-labelledby="admin-push"
      className="max-w-2xl rounded-2xl border border-zinc-200 p-6"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100">
          <Bell size={20} aria-hidden="true" />
        </span>
        <h2 id="admin-push" className="font-semibold text-zinc-900">
          Push notifications
        </h2>
      </div>
      <p className="text-sm leading-6 text-zinc-600">
        A nudge when your morning brief, evening debrief or weekly closeout is
        saved in EMDEE. Your private briefing stays inside Admin.
      </p>
      <p className="mt-4 text-sm font-medium" role="status">
        {status}
      </p>
      {state?.iosInstall && (
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          On iPhone or iPad, open Whatelz Admin from your home screen, then
          enable notifications here. Requires iOS/iPadOS 16.4 or later.
        </p>
      )}
      {state?.permission === "denied" && (
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Allow notifications for Whatelz Admin in your phone or browser
          settings, then reopen the app.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-amber-800">
          {state.error}
        </p>
      )}
      {state && !state.iosInstall && state.supported && !state.error && (
        <div className="mt-4 flex flex-wrap gap-3">
          {state.enabled ? (
            <>
              <button
                disabled={busy}
                onClick={test}
                className="min-h-11 rounded-xl bg-yellow-300 px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                Send test notification
              </button>
              <button
                disabled={busy}
                onClick={disable}
                className="min-h-11 rounded-xl border border-zinc-300 px-4 py-3 text-sm disabled:opacity-50"
              >
                Disable on this device
              </button>
            </>
          ) : (
            <button
              disabled={
                busy ||
                !state.config?.configured ||
                state.permission === "denied"
              }
              onClick={enable}
              className="min-h-11 rounded-xl bg-yellow-300 px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Enabling…" : "Enable push notifications"}
            </button>
          )}
        </div>
      )}
      {state?.config && !state.config.configured && (
        <p className="mt-3 text-sm text-amber-800">
          Push delivery is not configured yet. Your browser permission has not
          been changed.
        </p>
      )}
      {state?.enabled && (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Checks for newly saved routines every five minutes. Existing entries
          won’t be sent when you enable. This setting applies only to this
          device.
        </p>
      )}
      {state?.config?.monitor?.error_code && (
        <p className="mt-3 text-sm text-amber-800">
          {state.config.monitor.error_code === "delivery_failed" ? (
            "Push delivery needs attention. Send a test and check your device’s notification settings."
          ) : (
            <>
              Routine alerts need attention.{" "}
              <Link
                className="underline"
                href={adminUrl("/admin/today/connections")}
              >
                Check your EMDEE connection
              </Link>
              .
            </>
          )}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm leading-6 text-zinc-600">
          {message}
        </p>
      )}
    </section>
  );
}
