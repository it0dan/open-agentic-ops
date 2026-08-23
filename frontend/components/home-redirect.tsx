"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const autenticado = localStorage.getItem("fde-auth") === "mock";
    router.replace(autenticado ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
