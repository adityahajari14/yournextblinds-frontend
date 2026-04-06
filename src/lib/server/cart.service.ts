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

const CART_SCOPE = 'yournextblinds';

function getScopedCustomerEmail(customerEmail: string): string {
  return `${CART_SCOPE}:${customerEmail.trim().toLowerCase()}`;
}

export async function getCustomerCart(customerEmail: string): Promise<SerializedCartItem[]> {
  const scopedCustomerEmail = getScopedCustomerEmail(customerEmail);

  const cart =
    (await prisma.customerCart.findUnique({
      where: { customerEmail: scopedCustomerEmail },
      select: { items: true },
    })) ||
    (await prisma.customerCart.findUnique({
      where: { customerEmail },
      select: { items: true },
    }));

  if (!cart || !Array.isArray(cart.items)) return [];
  return cart.items as unknown as SerializedCartItem[];
}

export async function saveCustomerCart(
  customerEmail: string,
  items: SerializedCartItem[]
): Promise<SerializedCartItem[]> {
  const scopedCustomerEmail = getScopedCustomerEmail(customerEmail);

  const existingLegacyCart = await prisma.customerCart.findUnique({
    where: { customerEmail },
    select: { items: true },
  });

  await prisma.customerCart.upsert({
    where: { customerEmail: scopedCustomerEmail },
    update: { items: items as unknown as Prisma.InputJsonValue },
    create: {
      customerEmail: scopedCustomerEmail,
      items: items as unknown as Prisma.InputJsonValue,
    },
  });

  if (existingLegacyCart && customerEmail !== scopedCustomerEmail) {
    await prisma.customerCart.delete({
      where: { customerEmail },
    });
  }

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
