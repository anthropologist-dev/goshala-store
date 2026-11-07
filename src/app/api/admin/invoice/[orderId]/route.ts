import PDFDocument from "pdfkit";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { gstBreakup } from "@/lib/orders";

export const runtime = "nodejs";

// PDFKit's built-in fonts have no ₹ glyph, so amounts print as "Rs."
const rs = (p: number) => "Rs. " + (p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const { orderId } = await params;
  const o = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId), with: { items: true, invoice: true } });
  if (!o) return new Response("Not found", { status: 404 });
  const s = await getSettings();
  const isLabel = new URL(req.url).searchParams.has("label");

  if (isLabel) {
    // 4 x 6 inch shipping label
    const doc = new PDFDocument({ size: [288, 432], margin: 18 });
    doc.font("Helvetica-Bold").fontSize(10).text("TO:", { continued: false });
    doc.font("Helvetica-Bold").fontSize(15).text(o.name);
    doc.font("Helvetica").fontSize(12).text([o.address1, o.address2, `${o.city}, ${o.state}`].filter(Boolean).join("\n"));
    doc.font("Helvetica-Bold").fontSize(18).text(`PIN ${o.pincode}`);
    doc.font("Helvetica").fontSize(12).text(`Ph: +91 ${o.phone}`);
    doc.moveDown();
    if (o.paymentMethod === "COD" && o.paymentStatus !== "PAID") {
      doc.rect(18, doc.y, 252, 34).stroke();
      doc.font("Helvetica-Bold").fontSize(14).text(`COD: COLLECT ${rs(o.total)}`, 26, doc.y + 10);
      doc.moveDown(1.5);
    } else {
      doc.font("Helvetica-Bold").fontSize(12).text("PREPAID");
    }
    doc.moveDown();
    doc.font("Helvetica").fontSize(10).text(`Order: ${o.number}`, 18);
    doc.text(`Items: ${o.items.map((i) => `${i.sku} x${i.quantity}`).join(", ")}`);
    doc.moveTo(18, doc.y + 8).lineTo(270, doc.y + 8).stroke();
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(9).text("FROM:");
    doc.font("Helvetica").fontSize(9).text(`${s.businessName}\n${s.address}\n${s.phone}`);
    return new Response(new Uint8Array(await toBuffer(doc)), {
      headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="label-${o.number}.pdf"` },
    });
  }

  if (!o.invoice) return new Response("No invoice issued for this order yet. Confirm the order or click Issue invoice.", { status: 409 });
  const intra = o.state.trim().toLowerCase() === s.sellerState.trim().toLowerCase();
  const g = gstBreakup(o.items, intra);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const W = doc.page.width - 80;

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#1F331E").text(s.businessName, 40, 40);
  doc.font("Helvetica").fontSize(9).fillColor("#333").text(s.address, { width: 300 });
  doc.text(`${s.phone}  |  ${s.email}`);
  if (s.gstin) doc.text(`GSTIN: ${s.gstin}`);
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#1F331E").text(s.gstin ? "TAX INVOICE" : "INVOICE", 40, 40, { align: "right", width: W });
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  doc.text(`Invoice no: ${o.invoice.number}`, 40, 60, { align: "right", width: W });
  doc.text(`Date: ${o.invoice.issuedAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`, { align: "right", width: W });
  doc.text(`Order: ${o.number}`, { align: "right", width: W });
  doc.text(`Payment: ${o.paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}${o.upiRef ? ` (${o.upiRef})` : ""}`, { align: "right", width: W });

  let y = 130;
  doc.font("Helvetica-Bold").fontSize(9).text("Bill / Ship to", 40, y);
  doc.font("Helvetica").text([o.name, o.address1, o.address2, `${o.city}, ${o.state} - ${o.pincode}`, `Ph: +91 ${o.phone}`].filter(Boolean).join("\n"), 40, y + 12);
  doc.text(`Place of supply: ${o.state}`, 320, y + 12);
  y = 215;

  const cols = [
    { h: "#", w: 20 },
    { h: "Item", w: 170 },
    { h: "HSN", w: 50 },
    { h: "Qty", w: 30, r: true },
    { h: "Rate", w: 60, r: true },
    { h: "Taxable", w: 65, r: true },
    { h: "GST", w: 55, r: true },
    { h: "Amount", w: 65, r: true },
  ];
  const row = (vals: string[], bold = false) => {
    let x = 40;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5);
    const h = Math.max(...vals.map((v, i) => doc.heightOfString(v, { width: cols[i].w - 4 })));
    vals.forEach((v, i) => {
      doc.text(v, x + 2, y, { width: cols[i].w - 4, align: cols[i].r ? "right" : "left" });
      x += cols[i].w;
    });
    y += h + 6;
  };
  doc.rect(40, y - 4, W, 18).fill("#F3EADA").fillColor("#333");
  row(cols.map((c) => c.h), true);
  o.items.forEach((it, i) => {
    const l = g.lines[i];
    row([String(i + 1), `${it.productName} (${it.variantLabel})`, it.hsnCode ?? "-", String(it.quantity), rs(it.unitPrice), rs(l.taxable), l.rate ? `${l.rate}%\n${rs(l.tax)}` : "-", rs(l.gross)]);
  });
  doc.moveTo(40, y).lineTo(40 + W, y).strokeColor("#ccc").stroke();
  y += 8;

  const tot = (label: string, v: number, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    doc.text(label, 320, y, { width: 140 });
    doc.text(rs(v), 460, y, { width: 95, align: "right" });
    y += 15;
  };
  tot("Taxable value", g.taxable);
  if (intra) {
    tot("CGST", g.cgst);
    tot("SGST", g.sgst);
  } else tot("IGST", g.igst);
  tot("Shipping", o.shippingFee);
  if (o.codFee) tot("COD charge", o.codFee);
  doc.moveTo(320, y).lineTo(40 + W, y).stroke();
  y += 5;
  tot("Grand total", o.total, true);

  doc.font("Helvetica").fontSize(8).fillColor("#666");
  doc.text("Prices are inclusive of GST where applicable. This is a computer-generated invoice and needs no signature.", 40, y + 30, { width: W });
  doc.text("Thank you for supporting GouSeva.", { width: W });

  return new Response(new Uint8Array(await toBuffer(doc)), {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="invoice-${o.invoice.number.replace(/\//g, "-")}.pdf"` },
  });
}
