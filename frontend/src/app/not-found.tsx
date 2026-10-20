import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <p className="text-5xl font-bold text-emerald-600">404</p>
            <h1 className="text-xl font-semibold">Page not found</h1>
            <p className="text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
            <Link href="/" className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Go to FinTrack
            </Link>
        </main>
    );
}