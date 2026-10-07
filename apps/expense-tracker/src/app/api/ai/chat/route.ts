import { askAdvisor, type ChatMessage } from "@/app/_actions/advisor";
import { requireUser } from "../_auth";

export async function POST(request: Request) {
    const denied = await requireUser();
    if (denied) return denied;
    const body = (await request.json().catch(() => null)) as { history?: ChatMessage[] } | null;
    return Response.json(await askAdvisor(body?.history ?? []));
}
