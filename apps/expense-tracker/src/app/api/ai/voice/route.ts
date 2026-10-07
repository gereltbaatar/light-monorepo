import { parseVoiceTransaction } from "@/app/_actions/parse-voice";
import { requireUser } from "../_auth";

export async function POST(request: Request) {
    const denied = await requireUser();
    if (denied) return denied;
    return Response.json(await parseVoiceTransaction(await request.formData()));
}
