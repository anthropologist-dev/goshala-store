import QRCode from "qrcode";

export function upiLink(opts: { upiId: string; name: string; amount: number; orderNumber: string }) {
  const p = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.name,
    am: (opts.amount / 100).toFixed(2),
    cu: "INR",
    tn: `Order ${opts.orderNumber}`,
  });
  return `upi://pay?${p.toString().replace(/\+/g, "%20")}`;
}

export const upiQr = (link: string) => QRCode.toDataURL(link, { width: 320, margin: 1, color: { dark: "#1F331E", light: "#FFFFFF" } });
