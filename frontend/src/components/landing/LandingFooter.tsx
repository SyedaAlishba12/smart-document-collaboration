import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-[10px] font-bold text-white">
                SD
              </div>
              <span className="text-sm font-semibold text-[var(--foreground)]">StudioDocs</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
              Smart document collaboration for modern teams.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">Product</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
              <li><a href="#features" className="hover:text-[var(--primary)]">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-[var(--primary)]">How it works</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">Account</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
              <li><Link href="/login" className="hover:text-[var(--primary)]">Log in</Link></li>
              <li><Link href="/signup" className="hover:text-[var(--primary)]">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">Company</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
              <li className="text-[var(--muted-light)]">About (coming soon)</li>
              <li className="text-[var(--muted-light)]">Contact (coming soon)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border)] pt-6 text-center text-[10px] text-[var(--muted-light)]">
          © {new Date().getFullYear()} StudioDocs. Built as a student project.
        </div>
      </div>
    </footer>
  );
}
