import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";

import { AppShell } from "./app-shell";
import { AuthShell } from "./auth-shell";
import type { Viewer } from "@/shared/types/viewer";

/** A page that can wrap itself in a persistent layout (see pages/_app.tsx). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PageWithLayout<P = any> = NextPage<P> & {
  getLayout?: (page: ReactElement, props: P) => ReactNode;
};

export const appLayout = (page: ReactElement, props: { viewer: Viewer }) => (
  <AppShell viewer={props.viewer}>{page}</AppShell>
);

export const authLayout = (page: ReactElement) => <AuthShell>{page}</AuthShell>;
