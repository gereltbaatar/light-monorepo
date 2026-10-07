import { defineDictionary } from "../config";

type GoalCategoryKey = "general" | "travel" | "gadget" | "home" | "emergency";
type PeriodKey = "weekly" | "monthly" | "yearly";

interface GoalsDict {
    newGoal: string;
    addNewGoal: string;
    back: string;
    savings: string;
    savingsHint: string;
    plan: string;
    planHint: string;
    coverImage: string;
    coverPreviewAlt: string;
    removeImage: string;
    addPhoto: string;
    pickImageFile: string;
    imageTooLarge: string;
    title: string;
    savingsTitlePlaceholder: string;
    planTitlePlaceholder: string;
    targetAmount: string;
    alreadySaved: string;
    targetDate: string;
    category: string;
    categories: Record<GoalCategoryKey, string>;
    contribute: string;
    every: string;
    periodOptions: Record<PeriodKey, string>;
    periodUnit: Record<PeriodKey, string>;
    startDate: string;
    reminders: string;
    remindDue: string;
    remindMilestone: string;
    autoContribute: string;
    autoContributeHint: string;
    createGoal: string;
    goalCreated: string;
    createFailed: string;
    completed: string;
    saved: string;
    target: (amount: string) => string;
    toGo: (amount: string) => string;
    addMoney: string;
    withdraw: string;
    started: string;
    history: string;
    noContributions: string;
    deposit: string;
    withdrawal: string;
    addedToGoal: string;
    withdrawnFromGoal: string;
    deleteGoal: string;
    deleteConfirmTitle: (title: string) => string;
    deleteConfirmBody: string;
    cancel: string;
    delete: string;
    goalDeleted: string;
    withdrawTitle: string;
    depositTitle: string;
    amount: string;
    noteOptional: string;
    notePlaceholder: string;
    add: string;
    errors: {
        titleRequired: string;
        targetPositive: string;
        invalidKind: string;
        invalidImage: string;
        invalidCategory: string;
        invalidTargetDate: string;
        contributionPositive: string;
        pickPeriod: string;
        pickStartDate: string;
        signedOut: string;
        tableMissing: string;
        createFailed: string;
        startingAmount: string;
        amountPositive: string;
        invalidDirection: string;
        notFound: string;
        overWithdraw: string;
    };
}

export const goalsDict = defineDictionary<GoalsDict>({
    en: {
        newGoal: "New goal",
        addNewGoal: "Add new goal",
        back: "Back",
        savings: "Savings",
        savingsHint: "Save up to a target",
        plan: "Plan",
        planHint: "Fixed per period",
        coverImage: "Cover image",
        coverPreviewAlt: "Goal cover preview",
        removeImage: "Remove image",
        addPhoto: "Add a photo of your goal",
        pickImageFile: "Please pick an image file",
        imageTooLarge: "Image must be 5 MB or smaller",
        title: "Title",
        savingsTitlePlaceholder: "New bicycle",
        planTitlePlaceholder: "Emergency fund",
        targetAmount: "Target amount",
        alreadySaved: "Already saved",
        targetDate: "Target date",
        category: "Category",
        categories: {
            general: "General",
            travel: "Travel",
            gadget: "Gadget",
            home: "Home",
            emergency: "Emergency fund",
        },
        contribute: "Contribute",
        every: "Every",
        periodOptions: { weekly: "Week", monthly: "Month", yearly: "Year" },
        periodUnit: { weekly: "week", monthly: "month", yearly: "year" },
        startDate: "Start date",
        reminders: "Reminders",
        remindDue: "When a contribution is due",
        remindMilestone: "At every 25% milestone",
        autoContribute: "Auto-contribute",
        autoContributeHint: "Log the contribution each period",
        createGoal: "Create goal",
        goalCreated: "Goal created",
        createFailed: "Could not create goal",
        completed: "Completed",
        saved: "Saved",
        target: (amount) => `Target ${amount}`,
        toGo: (amount) => `${amount} to go`,
        addMoney: "Add money",
        withdraw: "Withdraw",
        started: "Started",
        history: "History",
        noContributions: "No contributions yet.",
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        addedToGoal: "Added to goal",
        withdrawnFromGoal: "Withdrawn from goal",
        deleteGoal: "Delete goal",
        deleteConfirmTitle: (title) => `Delete “${title}”?`,
        deleteConfirmBody:
            "The goal and its contribution history will be removed. This cannot be undone.",
        cancel: "Cancel",
        delete: "Delete",
        goalDeleted: "Goal deleted",
        withdrawTitle: "Withdraw from goal",
        depositTitle: "Add money to goal",
        amount: "Amount",
        noteOptional: "Note (optional)",
        notePlaceholder: "Salary bonus",
        add: "Add",
        errors: {
            titleRequired: "Title is required",
            targetPositive: "Enter a target greater than 0",
            invalidKind: "Invalid goal type",
            invalidImage: "Invalid image URL",
            invalidCategory: "Invalid category",
            invalidTargetDate: "Invalid target date",
            contributionPositive: "Enter a contribution greater than 0",
            pickPeriod: "Pick how often you contribute",
            pickStartDate: "Pick a start date",
            signedOut: "You must be signed in",
            tableMissing: "Run supabase-goals.sql in Supabase to enable goals.",
            createFailed: "Could not create goal",
            startingAmount: "Starting amount",
            amountPositive: "Enter an amount greater than 0",
            invalidDirection: "Invalid direction",
            notFound: "Goal not found",
            overWithdraw: "You can't withdraw more than you've saved",
        },
    },
    mn: {
        newGoal: "Шинэ зорилго",
        addNewGoal: "Зорилго нэмэх",
        back: "Буцах",
        savings: "Хуримтлал",
        savingsHint: "Зорилтот дүн хүртэл хуримтлуулах",
        plan: "Төлөвлөгөө",
        planHint: "Үе бүр тогтмол дүн",
        coverImage: "Нүүр зураг",
        coverPreviewAlt: "Зорилгын нүүр зураг",
        removeImage: "Зураг устгах",
        addPhoto: "Зорилгынхоо зургийг нэмэх",
        pickImageFile: "Зургийн файл сонгоно уу",
        imageTooLarge: "Зураг 5 MB-аас ихгүй байх ёстой",
        title: "Нэр",
        savingsTitlePlaceholder: "Шинэ дугуй",
        planTitlePlaceholder: "Яаралтай сан",
        targetAmount: "Зорилтот дүн",
        alreadySaved: "Хуримтлуулсан",
        targetDate: "Зорилтот огноо",
        category: "Ангилал",
        categories: {
            general: "Ерөнхий",
            travel: "Аялал",
            gadget: "Төхөөрөмж",
            home: "Гэр",
            emergency: "Яаралтай сан",
        },
        contribute: "Хуримтлуулах дүн",
        every: "Давтамж",
        periodOptions: { weekly: "7 хоног", monthly: "Сар", yearly: "Жил" },
        periodUnit: { weekly: "7 хоног", monthly: "сар", yearly: "жил" },
        startDate: "Эхлэх огноо",
        reminders: "Сануулга",
        remindDue: "Хуримтлуулах хугацаа болоход",
        remindMilestone: "25% хүрэх бүрт",
        autoContribute: "Автомат хуримтлал",
        autoContributeHint: "Үе бүр хуримтлалыг автоматаар бүртгэнэ",
        createGoal: "Зорилго үүсгэх",
        goalCreated: "Зорилго үүслээ",
        createFailed: "Зорилго үүсгэж чадсангүй",
        completed: "Биелсэн",
        saved: "Хуримтлуулсан",
        target: (amount) => `Зорилт ${amount}`,
        toGo: (amount) => `${amount} дутуу`,
        addMoney: "Мөнгө нэмэх",
        withdraw: "Авах",
        started: "Эхэлсэн",
        history: "Түүх",
        noContributions: "Одоогоор гүйлгээ алга.",
        deposit: "Нэмсэн",
        withdrawal: "Авсан",
        addedToGoal: "Зорилгод мөнгө нэмлээ",
        withdrawnFromGoal: "Зорилгоос мөнгө авлаа",
        deleteGoal: "Зорилго устгах",
        deleteConfirmTitle: (title) => `“${title}”-г устгах уу?`,
        deleteConfirmBody:
            "Зорилго болон түүний гүйлгээний түүх устна. Буцаах боломжгүй.",
        cancel: "Болих",
        delete: "Устгах",
        goalDeleted: "Зорилго устлаа",
        withdrawTitle: "Зорилгоос мөнгө авах",
        depositTitle: "Зорилгод мөнгө нэмэх",
        amount: "Дүн",
        noteOptional: "Тэмдэглэл (заавал биш)",
        notePlaceholder: "Цалингийн урамшуулал",
        add: "Нэмэх",
        errors: {
            titleRequired: "Нэр оруулна уу",
            targetPositive: "0-ээс их зорилтот дүн оруулна уу",
            invalidKind: "Зорилгын төрөл буруу байна",
            invalidImage: "Зургийн холбоос буруу байна",
            invalidCategory: "Ангилал буруу байна",
            invalidTargetDate: "Зорилтот огноо буруу байна",
            contributionPositive: "0-ээс их хуримтлуулах дүн оруулна уу",
            pickPeriod: "Хуримтлуулах давтамжаа сонгоно уу",
            pickStartDate: "Эхлэх огноо сонгоно уу",
            signedOut: "Нэвтэрсэн байх шаардлагатай",
            tableMissing: "Зорилго идэвхжүүлэхийн тулд Supabase-д supabase-goals.sql-г ажиллуулна уу.",
            createFailed: "Зорилго үүсгэж чадсангүй",
            startingAmount: "Эхний дүн",
            amountPositive: "0-ээс их дүн оруулна уу",
            invalidDirection: "Гүйлгээний чиглэл буруу байна",
            notFound: "Зорилго олдсонгүй",
            overWithdraw: "Хуримтлуулснаасаа их мөнгө авах боломжгүй",
        },
    },
});

interface BudgetsDict {
    addNewBudget: string;
    recurring: string;
    recurringHint: string;
    limit: string;
    limitHint: string;
    category: string;
    limitAmount: string;
    period: string;
    warnAt: string;
    periodOptions: Record<PeriodKey, string>;
    name: string;
    namePlaceholder: string;
    amount: string;
    repeats: string;
    dueDate: string;
    reminders: string;
    remind3d: string;
    remind1d: string;
    autoRepeat: string;
    autoRepeatHint: string;
    createBudget: string;
}

export const budgetsDict = defineDictionary<BudgetsDict>({
    en: {
        addNewBudget: "Add new budget",
        recurring: "Recurring",
        recurringHint: "Fixed bills",
        limit: "Limit",
        limitHint: "Spending cap",
        category: "Category",
        limitAmount: "Limit",
        period: "Period",
        warnAt: "Warn at",
        periodOptions: { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" },
        name: "Name",
        namePlaceholder: "Tog, Internet, Netflix…",
        amount: "Amount",
        repeats: "Repeats",
        dueDate: "Due date",
        reminders: "Reminders",
        remind3d: "3 days before",
        remind1d: "1 day before",
        autoRepeat: "Auto-repeat",
        autoRepeatHint: "Recreate the bill each period",
        createBudget: "Create budget",
    },
    mn: {
        addNewBudget: "Төсөв нэмэх",
        recurring: "Давтагдах",
        recurringHint: "Тогтмол төлбөр",
        limit: "Хязгаар",
        limitHint: "Зарлагын дээд хэмжээ",
        category: "Ангилал",
        limitAmount: "Хязгаар",
        period: "Хугацаа",
        warnAt: "Анхааруулах",
        periodOptions: { weekly: "7 хоног бүр", monthly: "Сар бүр", yearly: "Жил бүр" },
        name: "Нэр",
        namePlaceholder: "Цахилгаан, Интернэт, Netflix…",
        amount: "Дүн",
        repeats: "Давтамж",
        dueDate: "Төлөх огноо",
        reminders: "Сануулга",
        remind3d: "3 хоногийн өмнө",
        remind1d: "1 хоногийн өмнө",
        autoRepeat: "Автомат давталт",
        autoRepeatHint: "Үе бүр төлбөрийг дахин үүсгэнэ",
        createBudget: "Төсөв үүсгэх",
    },
});
