// Server-only: import from getServerSideProps and API routes, never from components.
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

import type { Viewer } from "@/shared/types/viewer";

import { createClient, type ServerSupabase } from "./supabase";

export type SessionUser = { id: string; email: string | null };

/** Verifies the session JWT (getClaims checks the signature) and returns a narrow user. */
export async function getUser(supabase: ServerSupabase): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
}

type AuthedContext = {
  ctx: GetServerSidePropsContext;
  supabase: ServerSupabase;
  user: SessionUser;
};

/**
 * getServerSideProps for signed-in pages: redirects to /login when there is no
 * session, loads the viewer for the app shell, then runs the page loader.
 * Props must be JSON-serialisable (no `undefined` values).
 */
export function withUser<P extends Record<string, unknown> = Record<string, never>>(
  loader?: (auth: AuthedContext) => Promise<P>,
) {
  return async (
    ctx: GetServerSidePropsContext,
  ): Promise<GetServerSidePropsResult<P & { viewer: Viewer }>> => {
    const supabase = createClient(ctx.req, ctx.res);
    const user = await getUser(supabase);
    if (!user) {
      return {
        redirect: {
          destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    const [{ data: profile }, props] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
      loader ? loader({ ctx, supabase, user }) : Promise.resolve({} as P),
    ]);

    return { props: { ...props, viewer: toViewer(user, profile) } };
  };
}

function toViewer(
  user: SessionUser,
  profile: { full_name: string | null; avatar_url: string | null } | null,
): Viewer {
  return {
    name: profile?.full_name ?? null,
    email: user.email,
    avatarUrl: profile?.avatar_url ?? null,
  };
}
