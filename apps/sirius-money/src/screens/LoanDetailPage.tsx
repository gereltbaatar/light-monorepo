import { notFound } from "next/navigation";
import { getContractUrl, getLoan, getLoanPayments } from "@/lib/loans";
import { LoanDetail } from "@/app/loans/[id]/_components/LoanDetail";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LoanDetailPage = async ({ id }: { id: string }) => {
    if (!UUID_PATTERN.test(id)) notFound();

    const [loan, payments] = await Promise.all([getLoan(id), getLoanPayments(id)]);
    if (!loan) notFound();
    const contractUrl = await getContractUrl(loan.contract_path);

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-[430px] mx-auto">
                <LoanDetail loan={loan} payments={payments} contractUrl={contractUrl} />
            </div>
        </div>
    );
};

export default LoanDetailPage;
