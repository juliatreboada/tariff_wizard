import Link from "next/link";
import { getMessages } from "@/lib/i18n";

export default function Home() {
  const t = getMessages();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t.home.title}
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t.home.subtitle}
          </p>
        </div>
        <Link
          href="/wizard"
          className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t.home.startWizard}
        </Link>
      </main>
    </div>
  );
}
