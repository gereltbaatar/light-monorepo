// Groups the integer part with apostrophes: 1000000.5 -> 1'000'000.5
export const formatAmount = (raw: string) => {
    const [whole = "", fraction] = raw.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return fraction === undefined ? grouped : `${grouped}.${fraction}`;
};
