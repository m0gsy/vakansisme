import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";
import { getLocale } from "@/lib/locale";

export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <>
      <Nav initialLocale={locale} />
      <main>{children}</main>
      <FooterCTA />
    </>
  );
}
