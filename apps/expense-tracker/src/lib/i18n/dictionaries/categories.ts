import { defineDictionary } from "../config";
import type { Category } from "@/lib/categories";

export const categoriesDict = defineDictionary<Record<Category, string>>({
    en: {
        food: "Food",
        coffee: "Coffee",
        shopping: "Shopping",
        taxi: "Taxi",
        entertainment: "Entertainment",
        bills: "Bills",
        health: "Health",
        salary: "Salary",
        gift: "Gift",
        other: "Other",
    },
    mn: {
        food: "Хоол хүнс",
        coffee: "Кофе",
        shopping: "Дэлгүүр",
        taxi: "Такси",
        entertainment: "Зугаа цэнгэл",
        bills: "Төлбөр",
        health: "Эрүүл мэнд",
        salary: "Цалин",
        gift: "Бэлэг",
        other: "Бусад",
    },
});
