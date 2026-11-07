import { NextResponse } from "next/server";
import { checkoutSchema, createOrder, OrderError } from "@/lib/orders";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Please check the highlighted fields", fieldErrors }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json({ orderId: order.id, number: order.number });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("checkout failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
