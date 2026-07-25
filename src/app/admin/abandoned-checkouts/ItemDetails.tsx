const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function fieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function ConfigurationGrid({ configuration }: { configuration: Record<string, unknown> | null | undefined }) {
  const entries = Object.entries(configuration || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '' && value !== 0
  );

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline gap-1 min-w-0">
          <span className="text-[11px] text-[#8c9196] shrink-0">{fieldLabel(key)}:</span>
          <span className="text-[11px] font-medium text-[#44464a] truncate">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

interface CheckoutItemLike {
  title: string;
  quantity: number;
  calculatedPrice: number;
  widthInches: number;
  heightInches: number;
  configuration: Record<string, unknown> | null | undefined;
}

export function CheckoutItemCard({ item, isLast }: { item: CheckoutItemLike; isLast: boolean }) {
  return (
    <div className={`py-2.5 ${isLast ? '' : 'border-b border-[#f1f1f1]'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[#202223]">
          {item.quantity} × {item.title}
        </span>
        <span className="text-[13px] font-medium text-[#202223] shrink-0">{money.format(item.calculatedPrice)} each</span>
      </div>
      <div className="text-xs text-[#6d7175] mt-0.5">
        {item.widthInches}&quot; W × {item.heightInches}&quot; H
      </div>
      <ConfigurationGrid configuration={item.configuration} />
    </div>
  );
}

interface CartItemLike {
  title: string;
  quantity: number;
  price: number;
  configuration?: Record<string, unknown> | null;
}

export function CartItemCard({ item, isLast }: { item: CartItemLike; isLast: boolean }) {
  return (
    <div className={`py-2.5 ${isLast ? '' : 'border-b border-[#f1f1f1]'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[#202223]">
          {item.quantity} × {item.title}
        </span>
        <span className="text-[13px] font-medium text-[#202223] shrink-0">{money.format(item.price)} each</span>
      </div>
      <ConfigurationGrid configuration={item.configuration} />
    </div>
  );
}
