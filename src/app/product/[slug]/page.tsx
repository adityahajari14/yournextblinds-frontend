import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Product } from '@/types';
import { ProductPage, CustomerReviewsSection, ProductFeatureSection, ProductComparisonSection, HowItWorksSection, ProductRechargeSection, ProductWarrantySection, ProductComparisonTableSection } from '@/components/product';
import { TopBar, Header, FlashSale, FAQ, Footer, NavBar } from '@/components';
import { fetchProductBySlug, fetchProducts, transformProduct } from '@/lib/api';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all products from backend
export async function generateStaticParams() {
  try {
    const response = await fetchProducts({ limit: 1000 });
    return response.data.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    // Silently fail during build - backend may be unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating static params:', error);
    }
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const response = await fetchProductBySlug(slug);
    const product = transformProduct(response.data);

    return {
      title: `${product.name} | Your Next Blinds`,
      description: product.description,
    };
  } catch {
    return {
      title: 'Product Not Found | Your Next Blinds',
    };
  }
}

export default async function ProductPageRoute({ params }: ProductPageProps) {
  const { slug } = await params;

  let productData;
  try {
    const response = await fetchProductBySlug(slug);
    productData = response.data;
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching product:', error);
    }
    notFound();
  }

  const product = transformProduct(productData);

  let relatedProducts: Product[] = [];
  try {
    const categorySlug = productData.categories.length > 0
      ? productData.categories[0].slug
      : null;

    const allProductsResponse = await fetchProducts({ limit: 100 });

    const sameCategoryProducts = allProductsResponse.data
      .filter((data) => {
        if (data.slug === product.slug) return false;
        if (categorySlug) {
          return data.categories.some((cat) => cat.slug === categorySlug);
        }
        return true;
      })
      .map((data) => transformProduct(data))
      .slice(0, 4);

    relatedProducts = sameCategoryProducts;

    if (relatedProducts.length < 4) {
      const otherProducts = allProductsResponse.data
        .filter((data) => {
          if (data.slug === product.slug) return false;
          if (categorySlug) {
            return !data.categories.some((cat) => cat.slug === categorySlug);
          }
          return true;
        })
        .map((data) => transformProduct(data))
        .filter((p) => !relatedProducts.some((rp) => rp.slug === p.slug))
        .slice(0, 4 - relatedProducts.length);

      relatedProducts.push(...otherProducts);
    }
  } catch (error) {
    // Silently fail - related products are optional
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching related products:', error);
    }
  }

  return (
    <>
      <TopBar />
      <Header />
      <NavBar />
      <main className="bg-white min-h-screen">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <ProductPage
            product={product}
            relatedProducts={relatedProducts}
          />
        </Suspense>
        {slug !== 'non-driii-honeycomb-blackout-blinds' && (
          <>
            <FlashSale />
            <FAQ />
          </>
        )}
        {slug === 'non-driii-honeycomb-blackout-blinds' && (
          <>
            <CustomerReviewsSection />
            <ProductFeatureSection />
            <ProductComparisonSection />
            <HowItWorksSection />
            <ProductRechargeSection />
            <ProductWarrantySection />
            <ProductComparisonTableSection />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
