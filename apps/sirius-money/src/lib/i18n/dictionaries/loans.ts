import { defineDictionary } from "../config";
import type { InterestRateUnit, LoanPeriod } from "@/lib/loan-contract";

interface LoansDict {
    title: string;
    add: string;
    emptyTitle: string;
    emptyHint: string;
    newLoan: string;
    back: string;
    lender: string;
    lenderPlaceholder: string;
    principal: string;
    installmentAmount: string;
    installmentCount: string;
    period: string;
    periodOptions: Record<LoanPeriod, string>;
    frequency: Record<LoanPeriod, string>;
    firstDueDate: string;
    totalToRepay: string;
    interest: string;
    createLoan: string;
    loanCreated: string;
    paid: string;
    remaining: (amount: string) => string;
    paidCount: (paid: number, total: number) => string;
    nextPayment: string;
    fullyRepaid: string;
    borrowed: string;
    installments: string;
    schedule: string;
    installment: (seq: number, total: number) => string;
    overdue: string;
    markPaid: string;
    undo: string;
    paymentMarked: string;
    paymentUndone: string;
    paymentTitle: (lender: string, seq: number, total: number) => string;
    uploadContract: string;
    uploadHint: string;
    readingContract: string;
    contractRead: string;
    checkValues: string;
    removeFile: string;
    contractSchedule: string;
    enterManually: string;
    paymentsCount: (count: number) => string;
    detailsOptional: string;
    loanType: string;
    loanTypePlaceholder: string;
    contractNumber: string;
    contractDate: string;
    maturityDate: string;
    interestRate: string;
    rateUnit: Record<InterestRateUnit, string>;
    rateValue: (rate: string, unit: InterestRateUnit) => string;
    fees: string;
    overview: string;
    payments: string;
    contract: string;
    totalInterest: string;
    paymentDay: string;
    monthDays: (days: string) => string;
    everyWeekday: (weekday: string) => string;
    perPayment: string;
    lastPayment: string;
    daysLeft: (days: number) => string;
    dueToday: string;
    daysOverdue: (days: number) => string;
    principalShort: string;
    interestShort: string;
    contractFile: string;
    viewContract: string;
    attachContract: string;
    replaceContract: string;
    contractAttached: string;
    noContract: string;
    deleteLoan: string;
    deleteConfirmTitle: (lender: string) => string;
    deleteConfirmBody: string;
    cancel: string;
    delete: string;
    loanDeleted: string;
    errors: {
        lenderRequired: string;
        principalPositive: string;
        installmentPositive: string;
        countRange: string;
        invalidPeriod: string;
        invalidSchedule: string;
        onceSingle: string;
        pickFirstDate: string;
        invalidDate: string;
        signedOut: string;
        tableMissing: string;
        createFailed: string;
        notFound: string;
        alreadyPaid: string;
    };
    contractErrors: {
        noFile: string;
        notPdf: string;
        tooLarge: string;
        signedOut: string;
        uploadFailed: string;
        bucketMissing: string;
        unreadable: string;
        busy: string;
        quota: string;
    };
}

export const loansDict = defineDictionary<LoansDict>({
    en: {
        title: "Loans",
        add: "Add",
        emptyTitle: "No loans yet",
        emptyHint: "Add a loan to keep track of its repayments",
        newLoan: "New loan",
        back: "Back",
        lender: "Lender",
        lenderPlaceholder: "Zeely, LendMN, Khan Bank…",
        principal: "Amount borrowed",
        installmentAmount: "Per payment",
        installmentCount: "Payments",
        period: "Every",
        periodOptions: {
            weekly: "Week",
            semimonthly: "Twice a month",
            monthly: "Month",
            quarterly: "Quarter",
            yearly: "Year",
            once: "One payment",
        },
        frequency: {
            weekly: "Weekly",
            semimonthly: "Twice a month",
            monthly: "Monthly",
            quarterly: "Quarterly",
            yearly: "Yearly",
            once: "One payment",
        },
        firstDueDate: "First payment",
        totalToRepay: "Total to repay",
        interest: "Interest & fees",
        createLoan: "Add loan",
        loanCreated: "Loan added",
        paid: "Repaid",
        remaining: (amount) => `${amount} left`,
        paidCount: (paid, total) => `${paid}/${total} paid`,
        nextPayment: "Next payment",
        fullyRepaid: "Fully repaid",
        borrowed: "Borrowed",
        installments: "Payments",
        schedule: "Schedule",
        installment: (seq, total) => `Payment ${seq} of ${total}`,
        overdue: "Overdue",
        markPaid: "Paid",
        undo: "Undo",
        paymentMarked: "Payment recorded",
        paymentUndone: "Payment unmarked",
        paymentTitle: (lender, seq, total) => `${lender} loan ${seq}/${total}`,
        uploadContract: "Upload contract (PDF)",
        uploadHint: "AI reads it and fills in the details",
        readingContract: "Reading the contract…",
        contractRead: "Contract read — check the details",
        checkValues: "Some numbers don't add up. Check them before saving.",
        removeFile: "Remove",
        contractSchedule: "Schedule from the contract",
        enterManually: "Enter manually",
        paymentsCount: (count) => `${count} payment${count === 1 ? "" : "s"}`,
        detailsOptional: "Contract details (optional)",
        loanType: "Loan type",
        loanTypePlaceholder: "Consumer loan",
        contractNumber: "Contract no.",
        contractDate: "Signed",
        maturityDate: "Ends",
        interestRate: "Interest rate",
        rateUnit: { monthly: "Monthly", yearly: "Yearly" },
        rateValue: (rate, unit) => `${rate}% / ${unit === "yearly" ? "year" : "month"}`,
        fees: "Fees",
        overview: "Overview",
        payments: "Repayment",
        contract: "Contract",
        totalInterest: "Total interest",
        paymentDay: "Due on",
        monthDays: (days) => `Day ${days} of the month`,
        everyWeekday: (weekday) => `Every ${weekday}`,
        perPayment: "Per payment",
        lastPayment: "Last payment",
        daysLeft: (days) => `in ${days} day${days === 1 ? "" : "s"}`,
        dueToday: "due today",
        daysOverdue: (days) => `${days} day${days === 1 ? "" : "s"} overdue`,
        principalShort: "Principal",
        interestShort: "Interest",
        contractFile: "Contract file",
        viewContract: "View PDF",
        attachContract: "Attach PDF",
        replaceContract: "Replace",
        contractAttached: "Contract attached",
        noContract: "Not attached",
        deleteLoan: "Delete loan",
        deleteConfirmTitle: (lender) => `Delete “${lender}”?`,
        deleteConfirmBody:
            "The loan and its schedule will be removed. Payments already recorded stay in your transactions.",
        cancel: "Cancel",
        delete: "Delete",
        loanDeleted: "Loan deleted",
        errors: {
            lenderRequired: "Enter the lender",
            principalPositive: "Enter the amount borrowed",
            installmentPositive: "Enter the amount per payment",
            countRange: "Number of payments must be between 1 and 120",
            invalidPeriod: "Pick how often you pay",
            invalidSchedule: "The schedule has an invalid date or amount",
            onceSingle: "A one-payment loan has exactly 1 payment",
            pickFirstDate: "Pick the first payment date",
            invalidDate: "Invalid date",
            signedOut: "You need to be signed in",
            tableMissing: "Run supabase-loans.sql in Supabase to enable loans.",
            createFailed: "Couldn't add the loan",
            notFound: "Loan not found",
            alreadyPaid: "This payment is already recorded",
        },
        contractErrors: {
            noFile: "Choose a PDF file",
            notPdf: "Only PDF files are supported",
            tooLarge: "The PDF is larger than 7 MB",
            signedOut: "You need to be signed in",
            uploadFailed: "Couldn't upload the contract",
            bucketMissing: "Run supabase-loan-contracts.sql in Supabase to enable contracts.",
            unreadable: "Couldn't read the contract. Fill in the details by hand.",
            busy: "The AI is busy. Fill in the details by hand or try again.",
            quota: "Today's AI limit is reached. Fill in the details by hand.",
        },
    },
    mn: {
        title: "Зээл",
        add: "Нэмэх",
        emptyTitle: "Зээл бүртгэгдээгүй",
        emptyHint: "Зээлээ нэмээд эргэн төлөлтөө хянаарай",
        newLoan: "Шинэ зээл",
        back: "Буцах",
        lender: "Зээл олгогч",
        lenderPlaceholder: "Zeely, LendMN, Хаан банк…",
        principal: "Авсан дүн",
        installmentAmount: "Нэг удаагийн төлөлт",
        installmentCount: "Төлөлтийн тоо",
        period: "Давтамж",
        periodOptions: {
            weekly: "7 хоног",
            semimonthly: "Сард 2 удаа",
            monthly: "Сар",
            quarterly: "Улирал",
            yearly: "Жил",
            once: "Нэг удаа",
        },
        frequency: {
            weekly: "7 хоног бүр",
            semimonthly: "Сард 2 удаа",
            monthly: "Сар бүр",
            quarterly: "Улирал бүр",
            yearly: "Жил бүр",
            once: "Нэг удаа",
        },
        firstDueDate: "Эхний төлөлт",
        totalToRepay: "Нийт төлөх",
        interest: "Хүү, шимтгэл",
        createLoan: "Зээл нэмэх",
        loanCreated: "Зээл нэмэгдлээ",
        paid: "Төлсөн",
        remaining: (amount) => `${amount} үлдсэн`,
        paidCount: (paid, total) => `${paid}/${total} төлсөн`,
        nextPayment: "Дараагийн төлөлт",
        fullyRepaid: "Бүрэн төлөгдсөн",
        borrowed: "Авсан дүн",
        installments: "Төлөлт",
        schedule: "Төлөлтийн хуваарь",
        installment: (seq, total) => `${seq}/${total}-р төлөлт`,
        overdue: "Хоцорсон",
        markPaid: "Төлсөн",
        undo: "Буцаах",
        paymentMarked: "Төлөлт бүртгэгдлээ",
        paymentUndone: "Төлөлтийг буцаалаа",
        paymentTitle: (lender, seq, total) => `${lender} зээл ${seq}/${total}`,
        uploadContract: "Гэрээ оруулах (PDF)",
        uploadHint: "AI гэрээг уншаад мэдээллийг бөглөнө",
        readingContract: "Гэрээг уншиж байна…",
        contractRead: "Гэрээг уншлаа — мэдээллээ шалгана уу",
        checkValues: "Зарим тоо таарахгүй байна. Хадгалахаас өмнө шалгана уу.",
        removeFile: "Хасах",
        contractSchedule: "Гэрээний хуваарь",
        enterManually: "Гараар оруулах",
        paymentsCount: (count) => `${count} төлөлт`,
        detailsOptional: "Гэрээний мэдээлэл (заавал биш)",
        loanType: "Зээлийн төрөл",
        loanTypePlaceholder: "Хэрэглээний зээл",
        contractNumber: "Гэрээний дугаар",
        contractDate: "Гэрээний огноо",
        maturityDate: "Дуусах огноо",
        interestRate: "Хүү",
        rateUnit: { monthly: "Сарын", yearly: "Жилийн" },
        rateValue: (rate, unit) => `${unit === "yearly" ? "Жилийн" : "Сарын"} ${rate}%`,
        fees: "Шимтгэл, хураамж",
        overview: "Ерөнхий мэдээлэл",
        payments: "Төлөлт",
        contract: "Гэрээ",
        totalInterest: "Нийт хүү",
        paymentDay: "Төлөх өдөр",
        monthDays: (days) => `Сар бүрийн ${days}`,
        everyWeekday: (weekday) => `${weekday} бүр`,
        perPayment: "Нэг удаагийн төлөлт",
        lastPayment: "Сүүлийн төлөлт",
        daysLeft: (days) => `${days} хоног үлдсэн`,
        dueToday: "өнөөдөр",
        daysOverdue: (days) => `${days} хоног хоцорсон`,
        principalShort: "Үндсэн",
        interestShort: "Хүү",
        contractFile: "Гэрээний файл",
        viewContract: "PDF харах",
        attachContract: "PDF хавсаргах",
        replaceContract: "Солих",
        contractAttached: "Гэрээ хавсаргагдлаа",
        noContract: "Хавсаргаагүй",
        deleteLoan: "Зээл устгах",
        deleteConfirmTitle: (lender) => `“${lender}”-г устгах уу?`,
        deleteConfirmBody:
            "Зээл болон төлөлтийн хуваарь устна. Бүртгэсэн төлөлтүүд гүйлгээнд хэвээр үлдэнэ.",
        cancel: "Болих",
        delete: "Устгах",
        loanDeleted: "Зээл устлаа",
        errors: {
            lenderRequired: "Зээл олгогчоо оруулна уу",
            principalPositive: "Авсан дүнгээ оруулна уу",
            installmentPositive: "Нэг удаагийн төлөлтийн дүнг оруулна уу",
            countRange: "Төлөлтийн тоо 1-120 хооронд байна",
            invalidPeriod: "Төлөх давтамжаа сонгоно уу",
            invalidSchedule: "Хуваарьт буруу огноо эсвэл дүн байна",
            onceSingle: "Нэг удаагийн зээл яг 1 төлөлттэй байна",
            pickFirstDate: "Эхний төлөлтийн огноог сонгоно уу",
            invalidDate: "Огноо буруу байна",
            signedOut: "Нэвтэрсэн байх шаардлагатай",
            tableMissing: "Зээл идэвхжүүлэхийн тулд Supabase-д supabase-loans.sql-г ажиллуулна уу.",
            createFailed: "Зээл нэмж чадсангүй",
            notFound: "Зээл олдсонгүй",
            alreadyPaid: "Энэ төлөлт аль хэдийн бүртгэгдсэн байна",
        },
        contractErrors: {
            noFile: "PDF файл сонгоно уу",
            notPdf: "Зөвхөн PDF файл оруулна",
            tooLarge: "PDF 7 MB-аас том байна",
            signedOut: "Нэвтэрсэн байх шаардлагатай",
            uploadFailed: "Гэрээг хуулж чадсангүй",
            bucketMissing: "Гэрээ идэвхжүүлэхийн тулд Supabase-д supabase-loan-contracts.sql-г ажиллуулна уу.",
            unreadable: "Гэрээг уншиж чадсангүй. Мэдээллээ гараар бөглөнө үү.",
            busy: "AI ачаалалтай байна. Гараар бөглөх эсвэл дахин оролдоно уу.",
            quota: "Өнөөдрийн AI хязгаар дууслаа. Мэдээллээ гараар бөглөнө үү.",
        },
    },
});
