import { CategoryManager } from "@/app/(main)/categories/_components/CategoryManager";
import { getT } from "@/lib/i18n/server";
import { getCategories } from "@/lib/tasks";

export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([getCategories(), getT()]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.categories.title}</h1>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{categories.length}</span>
      </header>
      <CategoryManager categories={categories} />
    </div>
  );
}
