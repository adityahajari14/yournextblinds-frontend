// Shopify Admin API configuration (server-side only)

export const shopifyConfig = {
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  apiVersion: '2025-01',
};

export function validateShopifyConfig(): void {
  if (!shopifyConfig.storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN is required');
  }
  if (!shopifyConfig.adminAccessToken) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is required');
  }
}

export function getAdminApiUrl(endpoint: string): string {
  const domain = shopifyConfig.storeDomain.replace(/^https?:\/\//, '');
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}${endpoint}`;
}

export function getAdminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': shopifyConfig.adminAccessToken,
  };
}

export interface ShopifyCustomerOrderSummary {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currencyCode: string;
}

export interface ShopifyCustomerAccountProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  defaultAddress: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  recentOrders: ShopifyCustomerOrderSummary[];
}

const CUSTOMER_BY_EMAIL_QUERY = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
          defaultAddress {
            address1
            address2
            city
            province
            zip
            country
          }
          orders(first: 10, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                displayFinancialStatus
                displayFulfillmentStatus
                currentTotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type ShopifyCustomerByEmailGraphqlResponse = {
  data?: {
    customers?: {
      edges?: Array<{
        node?: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
          phone: string | null;
          defaultAddress?: {
            address1: string | null;
            address2: string | null;
            city: string | null;
            province: string | null;
            zip: string | null;
            country: string | null;
          } | null;
          orders?: {
            edges?: Array<{
              node?: {
                id: string;
                name: string;
                createdAt: string;
                displayFinancialStatus: string | null;
                displayFulfillmentStatus: string | null;
                currentTotalPriceSet?: {
                  shopMoney?: {
                    amount: string;
                    currencyCode: string;
                  } | null;
                } | null;
              };
            }>;
          } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

async function adminGraphqlFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  validateShopifyConfig();

  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify Admin GraphQL error [${response.status}]: ${body}`);
  }

  const json = (await response.json()) as T;
  return json;
}

export async function getShopifyCustomerByEmail(email: string): Promise<ShopifyCustomerAccountProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const result = await adminGraphqlFetch<ShopifyCustomerByEmailGraphqlResponse>(
    CUSTOMER_BY_EMAIL_QUERY,
    { query: `email:${normalizedEmail}` }
  );

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || 'Unknown Shopify customer lookup error');
  }

  const customer = result.data?.customers?.edges?.[0]?.node;
  if (!customer?.email) return null;

  const recentOrders: ShopifyCustomerOrderSummary[] =
    customer.orders?.edges?.map((edge) => edge.node)
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .map((order) => ({
        id: order.id,
        name: order.name,
        createdAt: order.createdAt,
        financialStatus: order.displayFinancialStatus,
        fulfillmentStatus: order.displayFulfillmentStatus,
        totalPrice: order.currentTotalPriceSet?.shopMoney?.amount || '0',
        currencyCode: order.currentTotalPriceSet?.shopMoney?.currencyCode || 'GBP',
      })) || [];

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    defaultAddress: customer.defaultAddress
      ? {
          address1: customer.defaultAddress.address1,
          address2: customer.defaultAddress.address2,
          city: customer.defaultAddress.city,
          province: customer.defaultAddress.province,
          zip: customer.defaultAddress.zip,
          country: customer.defaultAddress.country,
        }
      : null,
    recentOrders,
  };
}
