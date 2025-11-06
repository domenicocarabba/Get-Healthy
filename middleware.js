import { NextResponse } from "next/server";
export function middleware() {
    return NextResponse.next(); // middleware disattivato
}
export const config = { matcher: [] };
