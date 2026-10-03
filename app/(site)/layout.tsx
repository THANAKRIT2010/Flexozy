import Providers from "@/components/Providers";
import Header from "@/components/Header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main>{children}</main>
      <footer>Flexozy</footer>
    </Providers>
  );
}
