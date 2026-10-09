import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from '@/lib/server/shopify-admin';

// ============================================
// Chat subscriber capture
// ============================================
// When a shopper volunteers their name/email in conversation (or agrees to get
// offers by email), this upserts them as a Shopify customer with marketing
// consent — the same customer record used by every other marketing/email flow
// in the store, not a separate silo. Mirrors newsletter.service.ts's
// lookup-then-create-or-update shape; kept as its own file because the tag,
// input fields (first name), and trigger context are chat-specific.

const CHAT_ASSISTANT_TAG = 'chat-assistant';

export class ChatSubscriberError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ChatSubscriberError';
    this.statusCode = statusCode;
  }
}

export interface CaptureChatSubscriberRequest {
  email: string;
  /** First name only — the model is told to ask "who am I chatting with?", not for a full legal name. */
  name?: string | null;
}

export interface CaptureChatSubscriberResponse {
  email: string;
  alreadySubscribed: boolean;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Keeps only what's plausible as a first name — the model may pass "Sarah" or a whole sentence if a shopper over-answers. */
function sanitizeName(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().split(/\s+/)[0];
  if (!trimmed || trimmed.length > 40 || !/^[a-zA-Z'-]+$/.test(trimmed)) return undefined;
  return trimmed;
}

const CUSTOMER_BY_EMAIL_QUERY = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          firstName
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
          firstName?: string | null;
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
      throw new ChatSubscriberError('Shopify authentication failed.', 500);
    }
    if (response.status === 429) {
      throw new ChatSubscriberError('Too many requests. Please try again in a moment.', 429);
    }
    throw new ChatSubscriberError(`Shopify request failed: ${body}`, 500);
  }

  return (await response.json()) as T;
}

/**
 * Upserts the shopper as a Shopify customer subscribed to marketing, tagged
 * `chat-assistant`. Throws on any failure — callers must not report success to
 * the shopper unless this resolves, mirroring the price-ledger rule that the
 * model is never trusted to assert something it didn't actually verify.
 */
export async function captureChatSubscriber(
  request: CaptureChatSubscriberRequest
): Promise<CaptureChatSubscriberResponse> {
  validateShopifyConfig();

  const email = (request.email || '').trim().toLowerCase();
  if (!email || !isEmail(email)) {
    throw new ChatSubscriberError('Invalid email address', 400);
  }
  const firstName = sanitizeName(request.name);

  const lookup = await adminGraphqlFetch<CustomerLookupResponse>(CUSTOMER_BY_EMAIL_QUERY, {
    query: `email:${email}`,
  });

  if (lookup.errors?.length) {
    throw new ChatSubscriberError(
      `Failed to look up customer: ${lookup.errors[0]?.message || 'Unknown error'}`,
      500
    );
  }

  const existing = lookup.data?.customers?.edges?.[0]?.node;
  const alreadySubscribed = existing?.emailMarketingConsent?.marketingState === 'SUBSCRIBED';

  if (existing) {
    const tags = Array.from(new Set([...(existing.tags || []), CHAT_ASSISTANT_TAG]));
    // Only set firstName if the customer doesn't already have one — don't
    // overwrite a real name on file with whatever the shopper typed in chat.
    const updateInput: Record<string, unknown> = { id: existing.id, tags };
    if (firstName && !existing.firstName) updateInput.firstName = firstName;

    const tagResult = await adminGraphqlFetch<CustomerMutationResponse>(CUSTOMER_UPDATE_MUTATION, {
      input: updateInput,
    });

    if (tagResult.errors?.length) {
      throw new ChatSubscriberError(
        `Failed to subscribe: ${tagResult.errors[0]?.message || 'Unknown error'}`,
        500
      );
    }
    const tagUserErrors = tagResult.data?.customerUpdate?.userErrors || [];
    if (tagUserErrors.length > 0) {
      throw new ChatSubscriberError(
        `Shopify rejected the update: ${tagUserErrors.map((e) => e.message).join('; ')}`,
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
        throw new ChatSubscriberError(
          `Failed to subscribe: ${consentResult.errors[0]?.message || 'Unknown error'}`,
          500
        );
      }
      const consentUserErrors = consentResult.data?.customerEmailMarketingConsentUpdate?.userErrors || [];
      if (consentUserErrors.length > 0) {
        throw new ChatSubscriberError(
          `Shopify rejected the subscription: ${consentUserErrors.map((e) => e.message).join('; ')}`,
          422
        );
      }
    }

    return { email, alreadySubscribed };
  }

  const result = await adminGraphqlFetch<CustomerMutationResponse>(CUSTOMER_CREATE_MUTATION, {
    input: {
      email,
      ...(firstName ? { firstName } : {}),
      tags: [CHAT_ASSISTANT_TAG],
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
      },
    },
  });

  if (result.errors?.length) {
    throw new ChatSubscriberError(
      `Failed to subscribe: ${result.errors[0]?.message || 'Unknown error'}`,
      500
    );
  }
  const userErrors = result.data?.customerCreate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new ChatSubscriberError(
      `Shopify rejected the signup: ${userErrors.map((e) => e.message).join('; ')}`,
      422
    );
  }

  return { email, alreadySubscribed: false };
}
