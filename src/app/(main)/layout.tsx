import { SiteNav } from "@/components/goldsignal/SiteNav";
import { SiteFooter } from "@/components/goldsignal/SiteFooter";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  );
}
