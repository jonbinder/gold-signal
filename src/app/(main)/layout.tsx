import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}
