import {
  TopBar,
  Header,
  NavBar,
  Hero,
  WindowTypes,
  Categories,
  CategoryGrid,
  Installation,
  BestSelling,
  Craftsmanship,
  FreeSamples,
  FlashSale,
  FAQ,
  Footer,
} from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <TopBar />
        <Header />
        <NavBar />
      </header>

      {/* Main Content */}
      <main>
        <Hero />
        {/* <WindowTypes /> */}
        {/* <Categories /> */}
        <CategoryGrid />
        {/* <Installation /> */}
        <BestSelling />
        <Craftsmanship />
        <FreeSamples />
        <FlashSale />
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
