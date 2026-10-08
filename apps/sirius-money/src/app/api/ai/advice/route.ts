import { getAdvice } from "@/app/_actions/advisor";
import { requireUser } from "../_auth";

export async function GET() {
    const denied = await requireUser();
    if (denied) return denied;
    return Response.json(await getAdvice());
}
