import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';

// ============================================
// Newsletter signup popup service
// ============================================
//
// Captures the email from the "10% off first order" popup and upserts it as a
// Shopify customer with marketing consent, tagged `newsletter-popup` so these
// signups are distinguishable from checkout-created customers. The SUBSCRIBE10
// code shown to the customer must also exist as a real discount in Shopify.

const NEWSLETTER_POPUP_TAG = 'newsletter-popup';

export class NewsletterSignupError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'NewsletterSignupError';
    this.statusCode = statusCode;
  }
}

export interface NewsletterSignupRequest {
  email?: string;
}

export interface NewsletterSignupResponse {
  email: string;
  alreadySubscribed: boolean;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const CUSTOMER_BY_EMAIL_QUERY = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          tags
          emailMarketingConsent {
            marketingState
          }
        }
      }
    }
  }
`;

const CUSTOMER_CREATE_MUTATION = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_UPDATE_MUTATION = `
  mutation CustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_EMAIL_MARKETING_CONSENT_UPDATE_MUTATION = `
  mutation CustomerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type CustomerLookupResponse = {
  data?: {
    customers?: {
      edges?: Array<{
        node?: {
          id: string;
          tags?: string[];
          emailMarketingConsent?: { marketingState?: string | null } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

type CustomerMutationResponse = {
  data?: {
    customerCreate?: {
      customer?: { id: string } | null;
      userErrors?: Array<{ field?: string[] | null; message: string }>;
    };
    customerUpdate?: {
      customer?: { id: string } | null;
      userErrors?: Array<{ field?: string[] | null; message: string }>;
    };
    customerEmailMarketingConsentUpdate?: {
      customer?: { id: string } | null;
      userErrors?: Array<{ field?: string[] | null; message: string }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

async function adminGraphqlFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new NewsletterSignupError('Shopify authentication failed.', 500);
    }
    if (response.status === 429) {
      throw new NewsletterSignupError('Too many requests. Please try again in a moment.', 429);
    }
    throw new NewsletterSignupError(`Shopify request failed: ${body}`, 500);
  }

  return (await response.json()) as T;
}

export async function subscribeToNewsletter(
  request: NewsletterSignupRequest
): Promise<NewsletterSignupResponse> {
  validateShopifyConfig();

  const email = (request.email || '').trim().toLowerCase();
  if (!email || !isEmail(email)) {
    throw new NewsletterSignupError('Invalid email address', 400);
  }

  const lookup = await adminGraphqlFetch<CustomerLookupResponse>(CUSTOMER_BY_EMAIL_QUERY, {
    query: `email:${email}`,
  });

  if (lookup.errors?.length) {
    throw new NewsletterSignupError(
      `Failed to look up customer: ${lookup.errors[0]?.message || 'Unknown error'}`,
      500
    );
  }

  const existing = lookup.data?.customers?.edges?.[0]?.node;
  const alreadySubscribed = existing?.emailMarketingConsent?.marketingState === 'SUBSCRIBED';

  if (existing) {
    const tags = Array.from(new Set([...(existing.tags || []), NEWSLETTER_POPUP_TAG]));
    const tagResult = await adminGraphqlFetch<CustomerMutationResponse>(CUSTOMER_UPDATE_MUTATION, {
      input: {
        id: existing.id,
        tags,
      },
    });

    if (tagResult.errors?.length) {
      throw new NewsletterSignupError(
        `Failed to subscribe: ${tagResult.errors[0]?.message || 'Unknown error'}`,
        500
      );
    }
    const tagUserErrors = tagResult.data?.customerUpdate?.userErrors || [];
    if (tagUserErrors.length > 0) {
      throw new NewsletterSignupError(
        `Shopify rejected the signup: ${tagUserErrors.map((e) => e.message).join('; ')}`,
        422
      );
    }

    if (!alreadySubscribed) {
      const consentResult = await adminGraphqlFetch<CustomerMutationResponse>(
        CUSTOMER_EMAIL_MARKETING_CONSENT_UPDATE_MUTATION,
        {
          input: {
            customerId: existing.id,
            emailMarketingConsent: {
              marketingState: 'SUBSCRIBED',
              marketingOptInLevel: 'SINGLE_OPT_IN',
            },
          },
        }
      );

      if (consentResult.errors?.length) {
        throw new NewsletterSignupError(
          `Failed to subscribe: ${consentResult.errors[0]?.message || 'Unknown error'}`,
          500
        );
      }
      const consentUserErrors = consentResult.data?.customerEmailMarketingConsentUpdate?.userErrors || [];
      if (consentUserErrors.length > 0) {
        throw new NewsletterSignupError(
          `Shopify rejected the signup: ${consentUserErrors.map((e) => e.message).join('; ')}`,
          422
        );
      }
    }

    return { email, alreadySubscribed };
  }

  const result = await adminGraphqlFetch<CustomerMutationResponse>(CUSTOMER_CREATE_MUTATION, {
    input: {
      email,
      tags: [NEWSLETTER_POPUP_TAG],
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
      },
    },
  });

  if (result.errors?.length) {
    throw new NewsletterSignupError(
      `Failed to subscribe: ${result.errors[0]?.message || 'Unknown error'}`,
      500
    );
  }
  const userErrors = result.data?.customerCreate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new NewsletterSignupError(
      `Shopify rejected the signup: ${userErrors.map((e) => e.message).join('; ')}`,
      422
    );
  }

  return { email, alreadySubscribed: false };
}
