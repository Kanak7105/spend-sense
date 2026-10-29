import type { InferGetServerSidePropsType } from "next";

import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { CategoryList } from "@/frontend/features/categories/components/category-list";
import { listCategories } from "@/backend/features/categories/queries";
import { withUser } from "@/backend/lib/auth";

export const getServerSideProps = withUser(async ({ supabase }) => ({
  categories: await listCategories(supabase),
}));

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const CategoriesPage: PageWithLayout<Props> = ({ categories }) => (
  <>
    <PageTitle title="Categories" />
    <PageHeader
      title="Categories"
      description="Group spending and income the way you think about it."
    />
    <CategoryList categories={categories} />
  </>
);

CategoriesPage.getLayout = appLayout;
export default CategoriesPage;
