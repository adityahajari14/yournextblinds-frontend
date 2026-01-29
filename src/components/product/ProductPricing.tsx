'use client';

interface ProductPricingProps {
  price: number;
  additionalCost: number;
}

const ProductPricing = ({ price, additionalCost }: ProductPricingProps) => {
  const totalPrice = price + additionalCost;

  return (
    <div className="flex flex-col gap-3 bg-[#f9f9f9] p-4 rounded">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#3a3a3a]">$ {totalPrice.toFixed(0)}</span>
      </div>
      
      <button className="w-full bg-[#00473c] text-white py-3 rounded text-base font-medium hover:bg-[#003a31] transition-colors">
        Customize and Buy
      </button>
    </div>
  );
};

export default ProductPricing;
