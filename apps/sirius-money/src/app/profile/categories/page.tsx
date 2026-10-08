import Image from "next/image";
import { SettingsPageHeader } from "@/app/profile/_components";
import { BottomNav } from "@/components/navigation/BottomNav";
import { getT } from "@/lib/i18n/server";
import { categoriesDict } from "@/lib/i18n/dictionaries/categories";
import { profileDict } from "@/lib/i18n/dictionaries/profile";
import {
    EXPENSE_CATEGORY_KEYS,
    INCOME_CATEGORY_KEYS,
    categoryImage,
    type Category,
} from "@/lib/categories";

const CategoryGrid = ({
    title,
    keys,
    labels,
}: {
    title: string;
    keys: Category[];
    labels: Record<Category, string>;
}) => (
    <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
        </h2>
        <div className="grid grid-cols-3 gap-3">
            {keys.map((key) => (
                <div key={key} className="flex flex-col items-center gap-2">
                    <div className="flex aspect-square w-full items-center justify-center rounded-[28px] bg-surface-2">
                        <Image
                            src={categoryImage(key)}
                            alt=""
                            width={72}
                            height={72}
                            className="h-[62%] w-[62%] object-contain"
                        />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        {labels[key]}
                    </p>
                </div>
            ))}
        </div>
    </section>
);

export default async function CategoriesSettingsPage() {
    const t = await getT(profileDict);
    const labels = await getT(categoriesDict);

    return (
        <div className="mx-auto w-full max-w-[430px] pb-28">
            <SettingsPageHeader title={t.settings.categories} />

            <div className="flex flex-col gap-8 px-4 pt-2">
                <CategoryGrid title={t.categoriesPage.expense} keys={EXPENSE_CATEGORY_KEYS} labels={labels} />
                <CategoryGrid title={t.categoriesPage.income} keys={INCOME_CATEGORY_KEYS} labels={labels} />
            </div>

            <BottomNav />
        </div>
    );
}
