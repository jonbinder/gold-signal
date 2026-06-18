import { NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_ADDRESS = "reports@goldsignal.ai";
const NOTIFY_TO = "jonathanbinder.inc@gmail.com";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = (await req.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[waitlist] RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  // TODO: Insert waitlist signup into Supabase when ready to persist signups.

  const timestamp = new Date().toISOString();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: NOTIFY_TO,
    subject: "New GoldSignal Waitlist Signup",
    text: `A new visitor joined the waitlist: ${email} — submitted at ${timestamp}`,
    html: `<p>A new visitor joined the waitlist: <strong>${email}</strong> — submitted at ${timestamp}</p>`,
  });

  if (error) {
    console.error("[waitlist] Resend send failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
