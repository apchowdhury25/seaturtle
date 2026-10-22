import { SiteFooter, SiteHeader } from "@/components/site-frame";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip">
      <SiteHeader />
      <main id="content" className="w-full min-w-0 flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
