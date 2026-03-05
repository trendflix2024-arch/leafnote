import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// DELETE /api/account — 계정 및 모든 데이터 영구 삭제
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    if (!userId) {
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    try {
        // 1. 사용자의 프로젝트 ID 목록 조회
        const { data: projects } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", userId);

        const projectIds = (projects || []).map((p: any) => p.id);

        // 2. 채팅 메시지 삭제 (프로젝트별)
        if (projectIds.length > 0) {
            await supabase
                .from("chat_messages")
                .delete()
                .in("project_id", projectIds);
        }

        // 3. 프로젝트 삭제
        await supabase
            .from("projects")
            .delete()
            .eq("user_id", userId);

        // 4. 프로필 삭제
        await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Account deletion error:", err);
        return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
    }
}
