import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { toggleInquiry } from "../../actions";

export default async function Inquiries() {
  const rows = await db.query.inquiries.findMany({ orderBy: desc(schema.inquiries.createdAt), limit: 200 });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Inquiries</h1>
      {rows.length === 0 && <p className="card p-8 text-center text-stone-500">No inquiries yet.</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className={`card flex flex-wrap items-start justify-between gap-3 p-4 ${r.handled ? "opacity-60" : ""}`}>
            <div>
              <a href={`mailto:${r.email}`} className="font-semibold underline">{r.email}</a>
              <p className="text-xs text-stone-500">{r.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              {r.message && <p className="mt-1 text-sm">{r.message}</p>}
            </div>
            <form action={toggleInquiry}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="handled" value={String(r.handled)} />
              <button className="btn-outline px-3 py-1.5 text-xs">{r.handled ? "Reopen" : "Mark done"}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
