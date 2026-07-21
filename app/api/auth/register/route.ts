import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "Public registration is disabled. Request an invitation from an administrator." },
        { status: 403 }
    );
}
