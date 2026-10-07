"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { askAdvisor, type ChatMessage } from "@/app/_actions/advisor";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { advisorDict } from "@/lib/i18n/dictionaries/advisor";

interface ChatContextValue {
    messages: ChatMessage[];
    isThinking: boolean;
    ask: (question: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChatStatus = () => useContext(ChatContext);

const useChat = () => {
    const value = useContext(ChatContext);
    if (!value) throw new Error("useChat must be used inside AdvisorChatProvider");
    return value;
};

export const AdvisorChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const t = useT(advisorDict);

    const ask = async (question: string) => {
        const text = question.trim();
        if (!text || isThinking) return;

        const next: ChatMessage[] = [...messages, { role: "user", text }];
        setMessages(next);
        setIsThinking(true);
        try {
            const result = await askAdvisor(next);
            setMessages([
                ...next,
                { role: "model", text: "error" in result ? result.error : result.reply },
            ]);
        } catch {
            setMessages([...next, { role: "model", text: t.chatFailed }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <ChatContext.Provider value={{ messages, isThinking, ask }}>
            {children}
        </ChatContext.Provider>
    );
};

export const QuestionChips = ({ questions }: { questions: string[] }) => {
    const { ask, isThinking } = useChat();

    return (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {questions.map((q) => (
                <button
                    key={q}
                    type="button"
                    disabled={isThinking}
                    onClick={() => ask(q)}
                    className="shrink-0 rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-60"
                >
                    {q}
                </button>
            ))}
        </div>
    );
};

export const ChatThread = () => {
    const { messages, isThinking } = useChat();
    const t = useT(advisorDict);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length, isThinking]);

    if (!messages.length && !isThinking) return null;

    return (
        <div className="space-y-3">
            {messages.map((m, index) => (
                <div
                    key={index}
                    className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm",
                        m.role === "user"
                            ? "ml-auto rounded-br-lg bg-primary text-primary-foreground"
                            : "rounded-bl-lg bg-surface text-foreground"
                    )}
                >
                    {m.text}
                </div>
            ))}
            {isThinking && (
                <div className="flex w-fit items-center gap-2 rounded-3xl rounded-bl-lg bg-surface px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t.thinking}
                </div>
            )}
            <div ref={endRef} />
        </div>
    );
};

export const ChatInput = () => {
    const { ask, isThinking } = useChat();
    const [draft, setDraft] = useState("");
    const t = useT(advisorDict);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!draft.trim()) return;
        ask(draft);
        setDraft("");
    };

    return (
        <form
            onSubmit={submit}
            className="fixed inset-x-0 bottom-28 z-40 mx-auto flex w-full max-w-[430px] items-center gap-2 px-4"
        >
            <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                placeholder={t.askPlaceholder}
                className="h-14 flex-1 rounded-full border border-border bg-surface px-5 text-sm text-foreground shadow-lg outline-none placeholder:text-muted-foreground focus:border-foreground/30"
            />
            <button
                type="submit"
                disabled={isThinking || !draft.trim()}
                aria-label={t.send}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4285F4, #9B72CB, #EA4335)" }}
            >
                {isThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            </button>
        </form>
    );
};
