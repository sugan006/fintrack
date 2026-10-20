import type { Metadata } from "next";

// The page is a Client Component, so its browser tab title is set here
export const metadata: Metadata = { title: "Create account" };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}