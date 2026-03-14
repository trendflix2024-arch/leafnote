"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, ArrowLeft, BookOpen, PenLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = ["전체", "에세이", "자서전", "소설", "시", "여행"];

const COVER_COLORS = [
    "from-amber-100 to-orange-50",
    "from-blue-100 to-indigo-50",
    "from-teal-100 to-emerald-50",
    "from-purple-100 to-violet-50",
    "from-rose-100 to-pink-50",
    "from-sky-100 to-cyan-50",
];

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
    author: { id: string; name: string } | null;
    isLiked: boolean;
    isBookmarked: boolean;
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
    return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function PostCard({ post, colorClass, onLikeToggle, onBookmarkToggle }: {
    post: Post;
    colorClass: string;
    onLikeToggle: (id: string) => void;
    onBookmarkToggle: (id: string) => void;
}) {
    const router = useRouter();
    const { data: session } = useSession();

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session?.user) { router.push("/login"); return; }
        onLikeToggle(post.id);
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session?.user) { router.push("/login"); return; }
        onBookmarkToggle(post.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/community/${post.id}`)}
        >
            <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                        {(post.author?.name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{post.author?.name || "익명"}</p>
                        <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {post.category}
                    </span>
                </div>

                <h3 className="text-base font-bold font-serif text-slate-800 mb-2">{post.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                    {post.content}
                </p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-sm transition-all ${post.isLiked ? "text-rose-500 font-bold" : "text-slate-400 hover:text-rose-400"}`}
                    >
                        <Heart size={17} className={`transition-all ${post.isLiked ? "fill-rose-500 scale-110" : ""}`} />
                        <span>{post.like_count}</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/community/${post.id}`); }}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        <MessageCircle size={17} />
                        <span>{post.comment_count}</span>
                    </button>
                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-1.5 text-sm transition-all ${post.isBookmarked ? "text-amber-500" : "text-slate-400 hover:text-amber-400"}`}
                    >
                        <Bookmark size={17} className={post.isBookmarked ? "fill-amber-500" : ""} />
                    </button>
                    <div className="flex-1" />
                    <span className="text-xs text-slate-300">더 읽기 →</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function CommunityPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [activeCategory, setActiveCategory] = useState("전체");
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchPosts = useCallback(async (category: string, cursorVal: string | null = null) => {
        try {
            const params = new URLSearchParams();
            if (category !== "전체") params.set("category", category);
            if (cursorVal) params.set("cursor", cursorVal);

            const res = await fetch(`/api/community/posts?${params}`);
            const data = await res.json();
            return data;
        } catch {
            return { posts: [], hasMore: false };
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setCursor(null);
        fetchPosts(activeCategory).then((data) => {
            setPosts(data.posts || []);
            setHasMore(data.hasMore || false);
            if (data.posts?.length > 0) {
                setCursor(data.posts[data.posts.length - 1].created_at);
            }
            setIsLoading(false);
        });
    }, [activeCategory, fetchPosts]);

    const loadMore = async () => {
        if (!cursor || isLoadingMore) return;
        setIsLoadingMore(true);
        const data = await fetchPosts(activeCategory, cursor);
        const newPosts = data.posts || [];
        setPosts((prev) => [...prev, ...newPosts]);
        setHasMore(data.hasMore || false);
        if (newPosts.length > 0) setCursor(newPosts[newPosts.length - 1].created_at);
        setIsLoadingMore(false);
    };

    const handleLikeToggle = async (postId: string) => {
        // Optimistic update
        setPosts((prev) => prev.map((p) =>
            p.id === postId
                ? { ...p, isLiked: !p.isLiked, like_count: p.isLiked ? p.like_count - 1 : p.like_count + 1 }
                : p
        ));
        try {
            const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
            if (!res.ok) throw new Error(`like failed (${res.status})`);
            const data = await res.json();
            setPosts((prev) => prev.map((p) =>
                p.id === postId ? { ...p, isLiked: data.liked, like_count: data.likeCount } : p
            ));
        } catch {
            // Revert on error
            setPosts((prev) => prev.map((p) =>
                p.id === postId
                    ? { ...p, isLiked: !p.isLiked, like_count: p.isLiked ? p.like_count - 1 : p.like_count + 1 }
                    : p
            ));
        }
    };

    const handleBookmarkToggle = async (postId: string) => {
        setPosts((prev) => prev.map((p) =>
            p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
        ));
        try {
            await fetch(`/api/community/posts/${postId}/bookmark`, { method: "POST" });
        } catch {
            setPosts((prev) => prev.map((p) =>
                p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
            ));
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] pb-24">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                        className="rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-serif font-bold text-slate-800">이야기 숲</h1>
                        <p className="text-xs text-slate-400">작가들의 이야기가 피어나는 공간</p>
                    </div>
                    {session?.user && (
                        <Link
                            href="/community/write"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-colors"
                        >
                            <PenLine size={13} />
                            글 올리기
                        </Link>
                    )}
                </div>

                <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                activeCategory === cat
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="text-emerald-500 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={36} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm mb-5">아직 이야기가 없어요</p>
                        {session?.user && (
                            <Link
                                href="/community/write"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-full hover:bg-emerald-700 transition-colors"
                            >
                                <PenLine size={15} />
                                첫 번째 이야기 올리기
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-slate-400 mb-4 font-medium">{posts.length}개의 이야기</p>
                        <div className="space-y-4">
                            {posts.map((post, i) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    colorClass={COVER_COLORS[i % COVER_COLORS.length]}
                                    onLikeToggle={handleLikeToggle}
                                    onBookmarkToggle={handleBookmarkToggle}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="px-6 py-2.5 border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                                    더 보기
                                </button>
                            </div>
                        )}
                    </>
                )}

                <p className="text-center text-xs text-slate-300 mt-12 mb-4 font-serif">
                    LeafNote • 모든 인생은 한 권의 책이다
                </p>
            </main>
        </div>
    );
}
