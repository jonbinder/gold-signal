export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-theme min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">{children}</div>;
}
