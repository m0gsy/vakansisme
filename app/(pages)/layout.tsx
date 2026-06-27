import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <FooterCTA />
    </>
  );
}
