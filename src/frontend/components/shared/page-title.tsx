import Head from "next/head";

/** Sets the document title as "<title> · SpendSense". */
export function PageTitle({ title }: { title?: string }) {
  return (
    <Head>
      <title>{title ? `${title} · SpendSense` : "SpendSense"}</title>
    </Head>
  );
}
