import {
  Baby,
  BadgePercent,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Car,
  CircleEllipsis,
  CirclePlus,
  Coffee,
  Dog,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Music,
  Pill,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  RotateCcw,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Stethoscope,
  Tag,
  TrainFront,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/frontend/lib/utils";

/**
 * Icons a category can use, keyed by the kebab-case name stored in
 * categories.icon. A fixed map keeps the bundle small (no dynamic icon import).
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  car: Car,
  fuel: Fuel,
  bus: Bus,
  "train-front": TrainFront,
  bike: Bike,
  plane: Plane,
  house: House,
  "building-2": Building2,
  receipt: Receipt,
  zap: Zap,
  wifi: Wifi,
  smartphone: Smartphone,
  repeat: Repeat,
  film: Film,
  music: Music,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  stethoscope: Stethoscope,
  pill: Pill,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  baby: Baby,
  dog: Dog,
  gift: Gift,
  wrench: Wrench,
  "badge-percent": BadgePercent,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "hand-coins": HandCoins,
  banknote: Banknote,
  landmark: Landmark,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  "rotate-ccw": RotateCcw,
  "circle-plus": CirclePlus,
  "circle-ellipsis": CircleEllipsis,
  tag: Tag,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({
  icon,
  color,
  className,
  size = "md",
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || Tag;
  const tint = color ?? "#64748b";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      style={{ backgroundColor: `${tint}22`, color: tint }}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
