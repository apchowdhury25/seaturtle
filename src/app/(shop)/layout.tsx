import { SiteFooter, SiteHeader } from "@/components/site-frame";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main id="content" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
