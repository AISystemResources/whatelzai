export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="px-8 py-6">
        <span className="font-mono text-sm font-semibold tracking-tight text-zinc-900">
          whatelz.ai
        </span>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="mb-4 font-mono text-sm tracking-widest text-zinc-400 uppercase">
          Edmund Lin Zhenming · AI Engineer
        </p>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-zinc-900 leading-tight sm:text-6xl">
          What <span className="text-zinc-400">ELZ</span> can you build with AI?
        </h1>
      </main>
    </div>
  );
}
