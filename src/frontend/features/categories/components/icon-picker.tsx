import { CATEGORY_ICONS, CATEGORY_ICON_NAMES } from "@/frontend/components/shared/category-icon";
import { cn } from "@/frontend/lib/utils";

export function IconPicker({
  value,
  onChange,
  color,
  id,
}: {
  value: string;
  onChange: (icon: string) => void;
  color: string;
  id?: string;
}) {
  return (
    <div id={id} role="radiogroup" className="grid grid-cols-8 gap-1.5 sm:grid-cols-9">
      {CATEGORY_ICON_NAMES.map((name) => {
        const Icon = CATEGORY_ICONS[name];
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name.replace(/-/g, " ")}
            onClick={() => onChange(name)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected && "border-current",
            )}
            style={selected ? { color, backgroundColor: `${color}22` } : undefined}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
