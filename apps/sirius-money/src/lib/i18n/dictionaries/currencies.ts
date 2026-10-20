import { defineDictionary } from "../config";

export const currenciesDict = defineDictionary({
    en: {
        title: "Currencies",
        selectedGroup: "Selected",
        otherGroup: "Not selected",
        rateSource: (date: string) => `Mongolbank rates · ${date}`,
        search: "Search currency",
        noMatch: "No currency found",
        unavailable: "Couldn't load rates from Mongolbank. Try again later.",
        failed: "Couldn't save your currencies",
    },
    mn: {
        title: "Валют",
        selectedGroup: "Сонгосон",
        otherGroup: "Сонгоогүй",
        rateSource: (date: string) => `Монголбанкны ханш · ${date}`,
        search: "Валют хайх",
        noMatch: "Валют олдсонгүй",
        unavailable: "Монголбанкнаас ханш татаж чадсангүй. Дараа дахин оролдоно уу.",
        failed: "Валютын тохиргоог хадгалж чадсангүй",
    },
});
