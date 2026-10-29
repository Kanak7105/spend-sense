import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { ConfirmDialog } from "@/frontend/components/shared/confirm-dialog";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";

import { useRefresh } from "@/frontend/lib/use-refresh";

import { deleteCategory } from "@/frontend/features/categories/api";
import type { Category, CategoryType } from "@/shared/schemas/categories";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoryList({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<CategoryType>("expense");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryType)}>
      <div className="flex items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <CategoryFormDialog
          key={tab}
          defaultType={tab}
          trigger={
            <Button>
              <Plus /> Add category
            </Button>
          }
        />
      </div>
      {(["expense", "income"] as const).map((type) => (
        <TabsContent key={type} value={type} className="mt-4">
          <ul className="divide-y rounded-xl border bg-card">
            {categories
              .filter((c) => c.type === type)
              .map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
          </ul>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = useRefresh();

  async function onDelete() {
    const result = await deleteCategory(category.id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Category deleted");
    await refresh();
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CategoryIcon icon={category.icon} color={category.color} />
      <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
      {category.is_default && <Badge variant="secondary">Default</Badge>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${category.name}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryFormDialog category={category} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${category.name}”?`}
        description="Its transactions will be kept but become uncategorised, and any budget for it will be removed."
        onConfirm={onDelete}
      />
    </li>
  );
}
