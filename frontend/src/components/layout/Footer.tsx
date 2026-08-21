export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] px-6 py-5 md:px-8">
      <div className="flex flex-col gap-2 text-xs text-[var(--muted-light)] sm:flex-row sm:items-center sm:justify-between">

        <p>
          SmartDocs · Document collaboration workspace
        </p>

        <div className="flex items-center gap-4">
          <span>Privacy</span>
          <span>Help</span>
          <span>v1.0</span>
        </div>

      </div>
    </footer>
  );
}