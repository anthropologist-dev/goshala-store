import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-5xl">Page not found</h1>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
