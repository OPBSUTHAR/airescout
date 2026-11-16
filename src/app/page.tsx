import Planner from "@/components/planner";

// AirScout landing page.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-lg font-black text-white">
            A
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AirScout</h1>
            <p className="text-sm text-zinc-500">
              Clean-air routing for Indian cities
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Every route looks the same on a map. It isn&apos;t the same to your
          lungs. AirScout scores each candidate path by the air you actually
          breathe along it, then shows what that cleaner route costs you in
          minutes.
        </p>
      </header>

      <Planner />

      <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        <p>
          Air quality:{" "}
          <a
            className="underline hover:text-blue-600"
            href="https://open-meteo.com/en/docs/air-quality-api"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo Air Quality API
          </a>{" "}
          · Routing:{" "}
          <a
            className="underline hover:text-blue-600"
            href="http://project-osrm.org/"
            target="_blank"
            rel="noreferrer"
          >
            OSRM
          </a>{" "}
          · Maps: OpenStreetMap
        </p>
        <p className="mt-2">
          Built by{" "}
          <a
            className="underline hover:text-blue-600"
            href="https://github.com/OPBSUTHAR"
            target="_blank"
            rel="noreferrer"
          >
            Omprakash Suthar (@OPBSUTHAR)
          </a>
        </p>
      </footer>
    </main>
  );
}