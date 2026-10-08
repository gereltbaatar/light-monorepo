import { parseReceipt } from "@/app/_actions/parse-receipt";
import { requireUser } from "../_auth";

export async function POST(request: Request) {
    const denied = await requireUser();
    if (denied) return denied;
    return Response.json(await parseReceipt(await request.formData()));
}
