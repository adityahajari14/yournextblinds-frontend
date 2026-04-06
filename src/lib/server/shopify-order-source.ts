const SOURCE_SITE = 'yournextblinds';
const SOURCE_TAG = `source:${SOURCE_SITE}`;

type ShopifyNoteAttribute = {
  name?: string;
  value?: string;
};

type ShopifyOrderPayload = {
  tags?: string | string[] | null;
  note_attributes?: ShopifyNoteAttribute[] | null;
};

function normalizeSourceValue(value: string | undefined | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function extractTags(tags: ShopifyOrderPayload['tags']): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => normalizeSourceValue(tag))
      .filter((tag): tag is string => Boolean(tag));
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => normalizeSourceValue(tag))
      .filter((tag): tag is string => Boolean(tag));
  }

  return [];
}

function extractSourceValues(noteAttributes: ShopifyOrderPayload['note_attributes']): string[] {
  if (!Array.isArray(noteAttributes)) {
    return [];
  }

  return noteAttributes
    .filter(
      (attribute) =>
        attribute?.name === 'sourceSite' || attribute?.name === 'sourceTag'
    )
    .map((attribute) => normalizeSourceValue(attribute.value))
    .filter((value): value is string => Boolean(value));
}

export function hasExplicitSource(order: ShopifyOrderPayload): boolean {
  return extractTags(order.tags).some((tag) => tag.startsWith('source:')) || extractSourceValues(order.note_attributes).length > 0;
}

export function orderMatchesSource(order: ShopifyOrderPayload): boolean {
  const expectedValues = new Set([SOURCE_SITE, SOURCE_TAG]);

  for (const value of extractTags(order.tags)) {
    if (expectedValues.has(value)) {
      return true;
    }
  }

  for (const value of extractSourceValues(order.note_attributes)) {
    if (expectedValues.has(value)) {
      return true;
    }
  }

  return false;
}

export { SOURCE_SITE, SOURCE_TAG };
