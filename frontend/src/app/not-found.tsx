import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-2 px-4">
      <p className="font-mono text-xs font-medium text-brand">404</p>
      <h1 className="text-[40px] font-semibold leading-tight">
        Sayfa bulunamadı
      </h1>
      <Link href="/" className="text-[15px] text-muted underline">
        Sınav programına dön
      </Link>
    </main>
  );
}
