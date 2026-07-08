import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email(),
  intent: z.enum(["hire", "collab", "service", "other"]).optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 }
    );
  }

  const { name, email, message } = parsed.data;

  const displayName = name ?? "Anonymous";
  const subject = `Message from ${displayName} via whatelz.ai`;
  const text = `From: ${displayName} <${email}>\n\n${message}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "whatelz.ai <contact@whatelz.ai>",
        to: "elz.work22@gmail.com",
        replyTo: email,
        subject,
        text,
      });
    } catch (err) {
      console.error("[contact] Resend failed:", err);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
  } else {
    console.log("[contact] RESEND_API_KEY not set — logging instead:");
    console.log({ subject, text });
  }

  return NextResponse.json({ ok: true });
}
