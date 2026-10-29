/** The signed-in user as shown in the app shell. Serialisable page prop. */
export type Viewer = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};
