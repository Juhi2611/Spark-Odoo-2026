/**
 * PageHeader — Reusable page title bar.
 *
 * Props:
 *  - title       (string)
 *  - subtitle    (string, optional)
 *  - children    (ReactNode, optional) – right-side slot (buttons, etc.)
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
