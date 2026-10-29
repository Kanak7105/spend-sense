import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { ColorPicker } from "@/frontend/components/shared/color-picker";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";

import { createCategory, updateCategory } from "@/frontend/features/categories/api";
import {
  categorySchema,
  type Category,
  type CategoryInput,
  type CategoryType,
} from "@/shared/schemas/categories";
import { IconPicker } from "./icon-picker";

type Props = {
  category?: Category;
  defaultType?: CategoryType;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CategoryFormDialog({ category, defaultType, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>Pick a name, icon and colour you&apos;ll recognise.</DialogDescription>
        </DialogHeader>
        <CategoryForm category={category} defaultType={defaultType} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  defaultType = "expense",
  onDone,
}: {
  category?: Category;
  defaultType?: CategoryType;
  onDone: () => void;
}) {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? defaultType,
      icon: category?.icon ?? "tag",
      color: category?.color ?? "#6366f1",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const refresh = useRefresh();
  const [icon, color] = useWatch({ control: form.control, name: ["icon", "color"] });

  async function onSubmit(values: CategoryInput) {
    const result = category
      ? await updateCategory(category.id, {
          name: values.name,
          icon: values.icon,
          color: values.color,
        })
      : await createCategory(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(category ? "Category updated" : "Category added");
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {!category && (
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList className="w-full">
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          )}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="category-name">Name</FieldLabel>
            <div className="flex items-center gap-3">
              <CategoryIcon icon={icon} color={color} />
              <Input
                id="category-name"
                placeholder="e.g. Coffee"
                aria-invalid={!!errors.name}
                {...form.register("name")}
              />
            </div>
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.icon}>
            <FieldLabel htmlFor="category-icon">Icon</FieldLabel>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => (
                <IconPicker
                  id="category-icon"
                  value={field.value}
                  onChange={field.onChange}
                  color={color}
                />
              )}
            />
            <FieldError errors={[errors.icon]} />
          </Field>
          <Field data-invalid={!!errors.color}>
            <FieldLabel htmlFor="category-color">Colour</FieldLabel>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker id="category-color" value={field.value} onChange={field.onChange} />
              )}
            />
            <FieldError errors={[errors.color]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="category-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : category ? "Save changes" : "Add category"}
        </Button>
      </DialogFooter>
    </>
  );
}
