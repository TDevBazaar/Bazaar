import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { StoreSubNav } from "@/components/store/StoreSubNav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="pt-16">
        <StoreSubNav />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
