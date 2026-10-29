import { useRouter } from "next/router";
import { useCallback } from "react";

/** Re-run the current page's getServerSideProps after a mutation. */
export function useRefresh() {
  const router = useRouter();
  return useCallback(() => router.replace(router.asPath, undefined, { scroll: false }), [router]);
}
