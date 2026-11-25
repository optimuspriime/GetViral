import { NextResponse } from "next/server";
import { resolveServerSession, attachGuestCookie } from "@/lib/auth/server-session";
import {
  attachQuotaCookie,
  getServerQuota,
  updateServerPlanOrRole,
} from "@/lib/quota/server-quota";
import type { SubscriptionPlanId } from "@/lib/subscription";

export async function GET(request: Request) {
  const session = await resolveServerSession(request);
  const subscription = await getServerQuota(session);

  const response = NextResponse.json({
    authenticated: session.authenticated,
    isGuest: session.isGuest,
    isAdmin: session.isAdmin,
    userId: session.userId,
    email: session.email,
    subscription,
  });

  attachGuestCookie(response, session);
  attachQuotaCookie(response, session, subscription);
  return response;
}

export async function POST(request: Request) {
  const session = await resolveServerSession(request);
  if (!session.authenticated || !session.userId) {
    return NextResponse.json(
      { error: "Unauthorized: Sign-in required to update account settings or subscription plan." },
      { status: 401 },
    );
  }

  let body: { planId?: SubscriptionPlanId; role?: "viewer" | "creator" } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (body.planId && body.planId !== "free") {
    return NextResponse.json(
      {
        error:
          "Billing provider required: Connect Stripe billing before upgrading above your 50-search account quota.",
        billingRequired: true,
      },
      { status: 402 },
    );
  }

  const updated = await updateServerPlanOrRole(session, {
    role: body.role === "creator" || body.role === "viewer" ? body.role : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Unable to update quota record." }, { status: 500 });
  }

  const response = NextResponse.json({
    success: true,
    subscription: updated,
  });
  attachQuotaCookie(response, session, updated);
  return response;
}
