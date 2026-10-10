"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import {
  createCategory,
  deleteCategory,
  type CategoryActionResult,
} from "@/app/_actions/categories";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  categoryName,
} from "@/lib/categories";
import { useI18n } from "@/lib/i18n/client";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [icon, setIcon] = useState("tag");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState<
    CategoryActionResult,
    FormData
  >(async (prev, formData) => {
    const result = await createCategory(prev, formData);
    if (result && "ok" in result) {
      setName("");
      setAdding(false);
    }
    return result;
  }, undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="group relative flex flex-col items-center gap-2"
          >
            <div className="grid aspect-square w-full place-items-center rounded-[28px] bg-muted">
              <CategoryIcon icon={c.icon} shaded className="size-[42%]" />
            </div>
            <p className="w-full truncate text-center text-sm font-medium">
              {categoryName(c, t)}
            </p>
            {!c.key && (
              <form
                action={deleteCategory.bind(null, c.id)}
                className="absolute -right-1 -top-1"
              >
                <button
                  type="submit"
                  aria-label={t.categories.delete}
                  title={t.categories.delete}
                  className="grid size-6 place-items-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </form>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-haspopup="dialog"
          className="flex flex-col items-center gap-2"
        >
          <span className="grid aspect-square w-full place-items-center rounded-[28px] border-2 border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
            <Plus className="size-7" />
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {t.categories.add}
          </span>
        </button>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-md gap-5 bg-card p-5 sm:rounded-[28px]">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t.categories.newCategory}
          </DialogTitle>
          <form action={action} className="space-y-5">
            <input type="hidden" name="icon" value={icon} />
            <input type="hidden" name="color" value={color} />
            <div className="flex items-center gap-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted">
                <CategoryIcon icon={icon} shaded className="size-7" />
              </span>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.categories.namePlaceholder}
                maxLength={30}
                required
                autoFocus
                className="h-11 rounded-xl bg-background"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.categories.icon}
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {Object.keys(CATEGORY_ICONS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={key}
                    aria-pressed={key === icon}
                    onClick={() => setIcon(key)}
                    className="grid aspect-square place-items-center rounded-xl transition-colors hover:bg-muted aria-pressed:bg-muted aria-pressed:ring-2 aria-pressed:ring-foreground/20"
                  >
                    <CategoryIcon icon={key} shaded className="size-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.categories.color}
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={value}
                    aria-pressed={value === color}
                    onClick={() => setColor(value)}
                    className="size-7 rounded-full ring-offset-2 ring-offset-card aria-pressed:ring-2 aria-pressed:ring-foreground"
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            </div>

            {state && "error" in state && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              className="h-11 w-full rounded-xl"
            >
              {pending ? t.categories.adding : t.categories.add}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
