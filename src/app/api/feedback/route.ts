import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    // Support both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
    const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
    const adminEmails = raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return adminEmails.includes(email.toLowerCase());
}

// POST /api/feedback — submit feedback (any authenticated user)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, screenshot, page_url } = await req.json();
    if (!description?.trim()) {
        return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
    }

    const { error } = await supabase.from("beta_feedback").insert({
        user_id: (session.user as any).id || session.user.email,
        user_name: session.user.name,
        user_email: session.user.email,
        description: description.trim(),
        screenshot: screenshot || null,
        page_url: page_url || null,
        status: "pending",
    });

    if (error) {
        console.error("Feedback insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// GET /api/feedback — list all feedback (admin only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("beta_feedback")
        .select("id, user_name, user_email, description, page_url, status, created_at, screenshot")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

// PATCH /api/feedback — update status (admin only)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await req.json();
    const { error } = await supabase
        .from("beta_feedback")
        .update({ status })
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
