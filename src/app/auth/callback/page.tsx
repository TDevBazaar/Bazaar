"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/store/supabase";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/tienda/admin";
  }
  return raw;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;
    let client;
    try {
      client = getSupabaseClient();
    } catch (err) {
      Promise.resolve().then(() => {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : "Error inicializando sesión."
          );
        }
      });
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        router.replace(nextPath);
      }
    });

    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session) {
          router.replace(nextPath);
        }
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(
          err instanceof Error ? err.message : "No se pudo completar el acceso."
        );
      });

    const fallbackTimer = window.setTimeout(() => {
      if (active) router.replace(nextPath);
    }, 3500);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimer);
    };
  }, [router, nextPath]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {errorMsg ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-bold">No pudimos completar el inicio de sesión</p>
          <p className="mt-1.5 text-xs">{errorMsg}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#6018F8]" />
          <p className="text-sm font-semibold text-zinc-800">
            Completando tu acceso con Google…
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#6018F8]" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
