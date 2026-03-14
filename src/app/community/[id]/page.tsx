"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Heart, MessageCircle, Bookmark, UserPlus, UserCheck,
    Send, Loader2, Trash2, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface Author {
    id: string;
    name: string;
}

interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    created_at: string;
    user_id: string;
    author: Author | null;
    isLiked: boolean;
    isBookmarked: boolean;
    isFollowing: boolean;
    isOwner: boolean;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    author: Author | null;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금";
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function CommunityPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;
    const { data: session } = useSession();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([
            fetch(`/api/community/posts/${postId}`).then((r) => r.json()),
            fetch(`/api/community/posts/${postId}/comment`).then((r) => r.json()),
        ]).then(([postData, commentData]) => {
            setPost(postData);
            setComments(commentData.comments || []);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, [postId]);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLike = async () => {
        if (!session?.user) { router.push("/login"); return; }
        if (!post) return;

        // Optimistic
        setPost((p) => p ? { ...p, isLiked: !p.isLiked, like_count: p.isLiked ? p.like_count - 1 : p.like_count + 1 } : p);

        const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
        const data = await res.json();
        setPost((p) => p ? { ...p, isLiked: data.liked, like_count: data.likeCount } : p);
    };

    const handleBookmark = async () => {
        if (!session?.user) { router.push("/login"); return; }
        if (!post) return;

        setPost((p) => p ? { ...p, isBookmarked: !p.isBookmarked } : p);
        await fetch(`/api/community/posts/${postId}/bookmark`, { method: "POST" });
    };

    const handleFollow = async () => {
        if (!session?.user) { router.push("/login"); return; }
        if (!post) return;

        setPost((p) => p ? { ...p, isFollowing: !p.isFollowing } : p);
        await fetch(`/api/community/follow/${post.user_id}`, { method: "POST" });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        if (!session?.user) { router.push("/login"); return; }

        setIsSubmittingComment(true);
        try {
            const res = await fetch(`/api/community/posts/${postId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            const data = await res.json();
            if (data.comment) {
                setComments((prev) => [...prev, data.comment]);
                setPost((p) => p ? { ...p, comment_count: p.comment_count + 1 } : p);
                setNewComment("");
            }
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("이 이야기를 삭제하시겠어요?")) return;
        const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
        if (res.ok) router.push("/community");
        else alert("삭제에 실패했어요.");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <Loader2 size={28} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-400">이야기를 찾을 수 없어요.</p>
                <Button variant="outline" onClick={() => router.push("/community")}>목록으로</Button>
            </div>
        );
    }

    const isMyPost = post.isOwner;
    const showFollowBtn = !isMyPost && !!session?.user;

    return (
        <div className="min-h-screen bg-[#faf9f6] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/community")}
                        className="rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1" />

                    {isMyPost && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu((v) => !v)}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
                            >
                                <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-11 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden z-30 w-36"
                                    >
                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                            삭제하기
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-6">
                {/* Author & meta */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                        {(post.author?.name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{post.author?.name || "익명"}</p>
                        <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {post.category}
                    </span>
                    {showFollowBtn && (
                        <button
                            onClick={handleFollow}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                post.isFollowing
                                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                        >
                            {post.isFollowing
                                ? <><UserCheck size={13} /> 팔로잉</>
                                : <><UserPlus size={13} /> 팔로우</>
                            }
                        </button>
                    )}
                </motion.div>

                {/* Title & content */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <h1 className="text-2xl font-serif font-bold text-slate-800 mb-5 leading-snug">{post.title}</h1>
                    <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>
                </motion.div>

                {/* Action bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-5 mt-8 pt-6 border-t border-slate-100"
                >
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 text-sm transition-all ${post.isLiked ? "text-rose-500 font-bold" : "text-slate-400 hover:text-rose-400"}`}
                    >
                        <Heart size={20} className={`transition-all ${post.isLiked ? "fill-rose-500 scale-110" : ""}`} />
                        <span>{post.like_count}</span>
                    </button>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MessageCircle size={20} />
                        <span>{post.comment_count}</span>
                    </div>
                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-2 text-sm transition-all ${post.isBookmarked ? "text-amber-500" : "text-slate-400 hover:text-amber-400"}`}
                    >
                        <Bookmark size={20} className={post.isBookmarked ? "fill-amber-500" : ""} />
                        <span className="text-xs">{post.isBookmarked ? "저장됨" : "저장"}</span>
                    </button>
                </motion.div>

                {/* Comments */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-8"
                >
                    <h2 className="text-sm font-bold text-slate-500 mb-4">댓글 {comments.length}개</h2>

                    <div className="space-y-4">
                        {comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                    {(c.author?.name || "?")[0]}
                                </div>
                                <div className="flex-1 bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
                                    <p className="text-xs font-bold text-slate-700 mb-1">{c.author?.name || "익명"}</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
                                    <p className="text-[10px] text-slate-300 mt-1.5">{timeAgo(c.created_at)}</p>
                                </div>
                            </div>
                        ))}

                        {comments.length === 0 && (
                            <p className="text-center text-sm text-slate-300 py-6">
                                첫 번째 댓글을 남겨보세요 💬
                            </p>
                        )}
                    </div>

                    {/* Comment input */}
                    <div className="mt-5 flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                            {((session?.user?.name || "?")[0])}
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                                placeholder={session?.user ? "따뜻한 응원 한마디..." : "로그인하면 댓글을 남길 수 있어요"}
                                disabled={!session?.user}
                                className="flex-1 text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || isSubmittingComment || !session?.user}
                                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-full flex items-center justify-center transition-colors shrink-0"
                            >
                                {isSubmittingComment
                                    ? <Loader2 size={15} className="animate-spin" />
                                    : <Send size={15} />
                                }
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
