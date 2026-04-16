import { prisma } from './database';
import type { Prisma } from '@/generated/prisma/client';

export interface SerializedCartItem {
  id: string;
  product: unknown;
  configuration: unknown;
  quantity: number;
  addedAt: string;
}

function cartItemKey(item: SerializedCartItem): string {
  const product = item.product as { slug?: string };
  return `${product?.slug || 'unknown'}::${JSON.stringify(item.configuration || {})}`;
}

export async function getCustomerCart(customerEmail: string): Promise<SerializedCartItem[]> {
  const cart = await prisma.customerCart.findUnique({
    where: { customerEmail: customerEmail.trim().toLowerCase() },
    select: { items: true },
  });

  if (!cart || !Array.isArray(cart.items)) return [];
  return cart.items as unknown as SerializedCartItem[];
}

export async function saveCustomerCart(
  customerEmail: string,
  items: SerializedCartItem[]
): Promise<SerializedCartItem[]> {
  const normalizedCustomerEmail = customerEmail.trim().toLowerCase();

  await prisma.customerCart.upsert({
    where: { customerEmail: normalizedCustomerEmail },
    update: { items: items as unknown as Prisma.InputJsonValue },
    create: {
      customerEmail: normalizedCustomerEmail,
      items: items as unknown as Prisma.InputJsonValue,
    },
  });

  return items;
}

export async function mergeCustomerCart(
  customerEmail: string,
  localItems: SerializedCartItem[]
): Promise<SerializedCartItem[]> {
  const existingItems = await getCustomerCart(customerEmail);
  const mergedMap = new Map<string, SerializedCartItem>();

  for (const item of existingItems) {
    mergedMap.set(cartItemKey(item), { ...item });
  }

  for (const item of localItems) {
    const key = cartItemKey(item);
    const existing = mergedMap.get(key);

    if (!existing) {
      mergedMap.set(key, { ...item });
      continue;
    }

    const existingDate = new Date(existing.addedAt).getTime();
    const nextDate = new Date(item.addedAt).getTime();

    mergedMap.set(key, {
      ...existing,
      quantity: existing.quantity + item.quantity,
      addedAt: nextDate > existingDate ? item.addedAt : existing.addedAt,
    });
  }

  const mergedItems = Array.from(mergedMap.values());
  await saveCustomerCart(customerEmail, mergedItems);
  return mergedItems;
}
