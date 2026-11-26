"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AFFILIATE_QUERY_PARAM,
  REFERRAL_QUERY_PARAM,
  captureReferralFromUrl,
} from "@/lib/store/referral";

/** Captura y mantiene el enlace de afiliado (?aff=handle) o legacy (?v=codigo) en cualquier ruta. */
export function ReferralCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const affParam = searchParams.get(AFFILIATE_QUERY_PARAM);
  const refParam = searchParams.get(REFERRAL_QUERY_PARAM);

  useEffect(() => {
    captureReferralFromUrl();
  }, [pathname, affParam, refParam]);

  return null;
}
