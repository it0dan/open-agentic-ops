"use client";

import { usePathname } from "next/navigation";

export function ContentContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullWidth = pathname === "/loops";

  return (
    <main
      className={
        fullWidth
          ? "flex-1"
          : "mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8"
      }
    >
      {children}
    </main>
  );
}
