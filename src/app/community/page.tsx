"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ArrowLeft, BookOpen, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["전체", "에세이", "자서전", "소설", "시", "여행"];

const MOCK_POSTS = [
    {
        id: 1,
        author: { name: "김서연", avatar: null, initial: "김" },
        title: "엄마의 손맛",
        category: "에세이",
        excerpt: "어릴 적 엄마가 끓여주던 된장찌개 냄새는 지금도 눈을 감으면 코끝에 맴돈다. 그 냄새는 단순한 음식 냄새가 아니었다. 피곤한 하루를 끝내고 집으로 돌아오는 나를 반겨주던 따뜻한 온기, 아무 말 없이도 '잘 왔다'고 말해주던 그 냄새.",
        likes: 47,
        comments: [
            { id: 1, author: "이민준", content: "읽으면서 저도 엄마 생각이 나서 울컥했어요. 너무 공감됩니다 🥺", createdAt: "2시간 전" },
            { id: 2, author: "박지현", content: "글이 정말 따뜻하게 느껴져요. 다음 편도 기대됩니다!", createdAt: "1시간 전" },
        ],
        createdAt: "3시간 전",
        coverColor: "from-amber-100 to-orange-50",
    },
    {
        id: 2,
        author: { name: "정우성", avatar: null, initial: "정" },
        title: "30년간의 직장생활을 마치며",
        category: "자서전",
        excerpt: "1994년 3월의 첫 출근날, 나는 넥타이 매는 법도 몰라서 아버지께 세 번이나 여쭤봤다. 그로부터 꼭 30년이 지난 오늘, 마지막 출근을 하면서 그날의 기억이 파노라마처럼 펼쳐졌다. 서툴렀던 나는 어디로 갔을까.",
        likes: 83,
        comments: [
            { id: 1, author: "한수진", content: "30년이라는 세월이 느껴지는 글이네요. 수고 많으셨어요 👏", createdAt: "5시간 전" },
        ],
        createdAt: "6시간 전",
        coverColor: "from-blue-100 to-indigo-50",
    },
    {
        id: 3,
        author: { name: "오하은", avatar: null, initial: "오" },
        title: "포르투갈에서 길을 잃다",
        category: "여행",
        excerpt: "리스본 골목 어딘가에서 나는 지도도, 인터넷도, 포르투갈어도 없이 혼자였다. 그런데 이상하게도 무섭지 않았다. 오히려 처음으로 온전히 '지금 이 순간'에 있는 기분이었다. 길을 잃었지만 나를 찾은 여행.",
        likes: 129,
        comments: [
            { id: 1, author: "최동혁", content: "저도 포르투갈 여행 다녀왔는데 이 감성 너무 공감돼요!", createdAt: "1일 전" },
            { id: 2, author: "유나연", content: "글이 마치 영화 같아요. 어떤 골목이었는지 궁금해요 ✨", createdAt: "22시간 전" },
            { id: 3, author: "강민서", content: "다음 편 언제 나와요? 계속 읽고 싶어요!", createdAt: "18시간 전" },
        ],
        createdAt: "1일 전",
        coverColor: "from-teal-100 to-emerald-50",
    },
    {
        id: 4,
        author: { name: "임채원", avatar: null, initial: "임" },
        title: "할아버지의 라디오",
        category: "소설",
        excerpt: "창고 한쪽에서 먼지를 뒤집어쓴 채 발견된 낡은 라디오. 주파수를 돌리자 지직거리는 소음 사이로 낯선 목소리가 흘러나왔다. '1978년 12월 25일 밤입니다.' 배터리도 없는 라디오에서.",
        likes: 214,
        comments: [
            { id: 1, author: "신예원", content: "소름!! 계속 써주세요 제발요 😱", createdAt: "2일 전" },
            { id: 2, author: "백준혁", content: "첫 문장부터 빠져들었어요. 단편 소설로 완성해주세요!", createdAt: "2일 전" },
        ],
        createdAt: "2일 전",
        coverColor: "from-purple-100 to-violet-50",
    },
    {
        id: 5,
        author: { name: "송지우", avatar: null, initial: "송" },
        title: "봄비 오던 날",
        category: "시",
        excerpt: "너에게 전화하려다\n번호를 지웠던 봄비 오던 날\n\n우산 하나로 둘이 걷던\n그 골목은 아직도 그대로겠지\n\n봄비는 왜 이렇게 따뜻한지.",
        likes: 96,
        comments: [
            { id: 1, author: "조은비", content: "봄비 내리는 날 읽어서 더 울컥했어요 🌧️", createdAt: "4일 전" },
        ],
        createdAt: "4일 전",
        coverColor: "from-rose-100 to-pink-50",
    },
];

interface Comment {
    id: number;
    author: string;
    content: string;
    createdAt: string;
}

interface Post {
    id: number;
    author: { name: string; avatar: null; initial: string };
    title: string;
    category: string;
    excerpt: string;
    likes: number;
    comments: Comment[];
    createdAt: string;
    coverColor: string;
}

function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>(post.comments);
    const [newComment, setNewComment] = useState("");

    const handleLike = () => {
        setLiked((prev) => !prev);
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments((prev) => [
            ...prev,
            { id: Date.now(), author: "나", content: newComment.trim(), createdAt: "방금" },
        ]);
        setNewComment("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
            {/* Cover gradient strip */}
            <div className={`h-2 bg-gradient-to-r ${post.coverColor}`} />

            <div className="p-5">
                {/* Author row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                        {post.author.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{post.author.name}</p>
                        <p className="text-xs text-slate-400">{post.createdAt}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {post.category}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold font-serif text-slate-800 mb-2">{post.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                    {post.excerpt}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-sm transition-all ${liked ? "text-rose-500 font-bold" : "text-slate-400 hover:text-rose-400"}`}
                    >
                        <Heart
                            size={17}
                            className={`transition-all ${liked ? "fill-rose-500 scale-110" : ""}`}
                        />
                        <span>{likeCount}</span>
                    </button>
                    <button
                        onClick={() => setShowComments((v) => !v)}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        <MessageCircle size={17} />
                        <span>{comments.length}</span>
                    </button>
                    <div className="flex-1" />
                    <button className="text-xs text-slate-300 hover:text-slate-500 transition-colors">
                        더 읽기
                    </button>
                </div>

                {/* Comments */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 space-y-3 border-t border-slate-50 pt-4">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                            {c.author[0]}
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none px-3 py-2">
                                            <p className="text-xs font-bold text-slate-700 mb-0.5">{c.author}</p>
                                            <p className="text-sm text-slate-600">{c.content}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{c.createdAt}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* New comment input */}
                                <div className="flex gap-2 mt-2">
                                    <input
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                        placeholder="따뜻한 응원 한마디..."
                                        className="flex-1 text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all placeholder:text-slate-300"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-full flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <Send size={15} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function CommunityPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("전체");
    const [showBeta, setShowBeta] = useState(true);

    const filtered =
        activeCategory === "전체"
            ? MOCK_POSTS
            : MOCK_POSTS.filter((p) => p.category === activeCategory);

    return (
        <div className="min-h-screen bg-[#faf9f6] pb-24">
            {/* Header */}
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
                        <h1 className="text-lg font-serif font-bold text-slate-800">리프노트 커뮤니티</h1>
                        <p className="text-xs text-slate-400">작가들의 이야기가 모이는 곳</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
                        <Sparkles size={13} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-600">베타</span>
                    </div>
                </div>

                {/* Category tabs */}
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
                {/* Beta notice */}
                <AnimatePresence>
                    {showBeta && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3"
                        >
                            <span className="text-lg shrink-0">🌱</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800 mb-0.5">테스트 페이지입니다</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    현재 샘플 데이터로 구성된 커뮤니티 미리보기입니다. 실제 서비스에서는 작가님의 작품을 직접 공유하고 피드백을 주고받을 수 있어요.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBeta(false)}
                                className="text-amber-400 hover:text-amber-600 shrink-0 mt-0.5"
                            >
                                <X size={15} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Post count */}
                <p className="text-xs text-slate-400 mb-4 font-medium">
                    {filtered.length}개의 이야기
                </p>

                {/* Posts */}
                <div className="space-y-4">
                    {filtered.length > 0 ? (
                        filtered.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                            >
                                <PostCard post={post} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <BookOpen size={36} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">아직 이야기가 없어요</p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-center text-white">
                    <p className="font-serif font-bold text-lg mb-1">나의 이야기도 공유해볼까요?</p>
                    <p className="text-sm text-emerald-100 mb-4">에코와 함께 쓴 이야기를 커뮤니티에 공개할 수 있어요</p>
                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-full px-6"
                    >
                        이야기 쓰러 가기
                    </Button>
                </div>

                <p className="text-center text-xs text-slate-300 mt-8 mb-4 font-serif">
                    LeafNote • 모든 인생은 한 권의 책이다
                </p>
            </main>
        </div>
    );
}
