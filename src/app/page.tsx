import {
  TopBar,
  Header,
  NavBar,
  Hero,
  UspBar,
  WindowTypes,
  Categories,
  CategoryGrid,
  Installation,
  BestSelling,
  Craftsmanship,
  FitGuaranteeSection,
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
        {/* <TopBar /> */}
        <Header />
        <NavBar />
      </header>

      {/* Main Content */}
      <main>
        <Hero />
        <UspBar />
        {/* <WindowTypes /> */}
        {/* <Categories /> */}
        <CategoryGrid />
        <BestSelling />
        <Craftsmanship />
        {/* <Installation /> */}
        <FitGuaranteeSection />
        <FreeSamples />
        <FlashSale />
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
