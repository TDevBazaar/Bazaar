"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureReferralFromUrl } from "@/lib/store/referral";

/** Captura y mantiene el código de vendedor (?v=codigo) en cualquier ruta del sitio. */
export function ReferralCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("v");

  useEffect(() => {
    captureReferralFromUrl();
  }, [pathname, refParam]);

  return null;
}
