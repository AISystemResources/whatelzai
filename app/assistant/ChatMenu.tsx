"use client";
import { useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu, SquarePen, X } from "lucide-react";
export function ChatMenu({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const newChat = () => {
    dialog.current?.close();
    router.push(`/assistant?new=1&draft=${crypto.randomUUID()}`);
  };
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-100">
        <button
          type="button"
          aria-label="Chat menu"
          aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold">
          fcOS Chat<span className="text-yellow-500">.</span>
        </h1>
        <button
          type="button"
          onClick={newChat}
          aria-label="New chat"
          title="New chat"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100"
        >
          <SquarePen size={21} aria-hidden="true" />
        </button>
      </header>
      <dialog
        ref={dialog}
        aria-labelledby="chat-menu-title"
        className="m-0 h-full max-h-none w-[min(90vw,360px)] max-w-none overflow-y-auto border-r border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-zinc-950/25"
        onClickCapture={(event) => {
          const anchor = (event.target as HTMLElement).closest("a");
          if (anchor?.getAttribute("href") === "/assistant?new=1") {
            event.preventDefault();
            newChat();
          } else if (anchor) dialog.current?.close();
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="chat-menu-title" className="text-xl font-semibold">
            Your workspace
          </h2>
          <button
            type="button"
            aria-label="Close chat menu"
            onClick={() => dialog.current?.close()}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
