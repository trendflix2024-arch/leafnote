"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Camera, Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "idle" | "capturing" | "form" | "submitting" | "done" | "error";

export function FeedbackWidget() {
    const { status } = useSession();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("idle");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [description, setDescription] = useState("");

    if (status !== "authenticated") return null;

    const handleOpen = () => {
        setStep("idle");
        setScreenshot(null);
        setDescription("");
        setOpen(true);
    };

    const handleCapture = async () => {
        setOpen(false);
        setStep("capturing");

        // Wait for modal close animation
        await new Promise((r) => setTimeout(r, 350));

        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(document.body, {
                scale: 0.5,
                useCORS: true,
                allowTaint: true,
                logging: false,
                ignoreElements: (el) => el.classList.contains("feedback-widget-ignore"),
            });
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            setScreenshot(dataUrl);
            setStep("form");
            setOpen(true);
        } catch {
            setStep("error");
            setOpen(true);
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) return;
        setStep("submitting");
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    screenshot,
                    page_url: window.location.href,
                }),
            });
            if (!res.ok) throw new Error("fail");
            setStep("done");
            setTimeout(() => {
                setOpen(false);
                setStep("idle");
                setDescription("");
                setScreenshot(null);
            }, 2500);
        } catch {
            setStep("form");
            alert("접수에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    const handleClose = () => {
        setOpen(false);
        setStep("idle");
        setScreenshot(null);
        setDescription("");
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                onClick={handleOpen}
                title="오류/개선사항 접수"
                className="feedback-widget-ignore fixed bottom-24 right-4 md:bottom-10 md:right-6 z-40 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-300/40 flex items-center justify-center transition-all hover:scale-110"
            >
                <MessageSquarePlus size={20} />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="feedback-widget-ignore fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) handleClose();
                        }}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        >
                            {/* Done */}
                            {step === "done" && (
                                <div className="text-center py-6">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <p className="font-bold font-serif text-slate-800 text-lg">접수 완료!</p>
                                    <p className="text-sm text-slate-500 mt-1">소중한 의견 감사드립니다 🌿</p>
                                </div>
                            )}

                            {/* Error */}
                            {step === "error" && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold font-serif text-slate-800">캡처 실패</h3>
                                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl mb-4">
                                        <AlertCircle size={18} className="text-red-500 shrink-0" />
                                        <p className="text-sm text-red-600">화면 캡처에 실패했습니다. 내용만 입력하여 접수하실 수 있습니다.</p>
                                    </div>
                                    <Button onClick={() => setStep("form")} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        내용만 입력하기
                                    </Button>
                                </>
                            )}

                            {/* Initial — capture prompt */}
                            {step === "idle" && (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold font-serif text-slate-800">오류 / 개선사항 접수</h3>
                                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">
                                        현재 화면을 캡처한 후 접수 내용을 작성해 주세요.<br />
                                        <span className="text-emerald-600 font-medium">베타 참여자분들의 의견이 리프노트를 키워갑니다.</span>
                                    </p>
                                    <Button
                                        onClick={handleCapture}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 h-12 text-base font-bold"
                                    >
                                        <Camera size={18} /> 화면 캡처 후 작성하기
                                    </Button>
                                    <button
                                        onClick={() => setStep("form")}
                                        className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        캡처 없이 내용만 입력하기
                                    </button>
                                </>
                            )}

                            {/* Form — after capture */}
                            {(step === "form" || step === "submitting") && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold font-serif text-slate-800">접수 내용 작성</h3>
                                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {screenshot && (
                                        <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                            <img src={screenshot} alt="캡처된 화면" className="w-full" />
                                            <p className="text-[10px] text-slate-400 text-center py-1.5">캡처된 화면</p>
                                        </div>
                                    )}

                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="어떤 오류나 개선사항이 있으셨나요? 자세히 적어주실수록 빠르게 반영됩니다."
                                        className="w-full h-28 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none text-sm text-slate-700 placeholder:text-slate-300 transition-all"
                                        autoFocus
                                    />

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!description.trim() || step === "submitting"}
                                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 font-bold"
                                    >
                                        {step === "submitting" ? (
                                            <Loader2 size={17} className="animate-spin" />
                                        ) : (
                                            <Send size={17} />
                                        )}
                                        접수하기
                                    </Button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
