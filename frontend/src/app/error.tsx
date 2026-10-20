"use client";

// Shown if a page crashes unexpectedly, instead of a blank screen
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-zinc-500">An unexpected error happened while showing this page.</p>
            <button onClick={reset}
                className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Try again
            </button>
        </main>
    );
}