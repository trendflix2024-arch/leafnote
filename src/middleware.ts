import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/dashboard",
        "/editor/:path*",
        "/editor",
        "/interview/:path*",
        "/interview",
        "/profile/:path*",
        "/profile",
        "/settings/:path*",
        "/settings",
        "/onboarding/:path*",
        "/onboarding",
    ],
};
