// Server-only: upload an image to Shopify Files and get back a public CDN URL.
//
// Used to host reviewer-submitted photos so their URLs can be handed to
// Judge.me's `picture_urls` (which only accepts publicly reachable URLs).
//
// Flow: stagedUploadsCreate -> POST bytes to the staged target -> fileCreate
// -> poll the file node until it is READY and has a CDN url.

import { adminGraphqlFetch } from '@/lib/server/shopify-admin';

const STAGED_UPLOADS_CREATE = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
      }
      userErrors { field message }
    }
  }
`;

const FILE_NODE = `
  query fileNode($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        id
        fileStatus
        image { url }
      }
    }
  }
`;

interface StagedTarget {
  url: string;
  resourceUrl: string;
  parameters: Array<{ name: string; value: string }>;
}

export interface UploadableImage {
  filename: string;
  mimeType: string;
  bytes: ArrayBuffer;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createStagedTarget(image: UploadableImage): Promise<StagedTarget> {
  const result = await adminGraphqlFetch<{
    data?: {
      stagedUploadsCreate?: {
        stagedTargets?: StagedTarget[];
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: Array<{ message?: string }>;
  }>(STAGED_UPLOADS_CREATE, {
    input: [
      {
        filename: image.filename,
        mimeType: image.mimeType,
        resource: 'IMAGE',
        httpMethod: 'POST',
        fileSize: String(image.bytes.byteLength),
      },
    ],
  });

  if (result.errors?.length) throw new Error(result.errors[0]?.message || 'stagedUploadsCreate failed');
  const payload = result.data?.stagedUploadsCreate;
  if (payload?.userErrors?.length) throw new Error(payload.userErrors.map((e) => e.message).join('; '));
  const target = payload?.stagedTargets?.[0];
  if (!target?.url) throw new Error('stagedUploadsCreate returned no target');
  return target;
}

async function putBytesToTarget(target: StagedTarget, image: UploadableImage): Promise<void> {
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append('file', new Blob([image.bytes], { type: image.mimeType }), image.filename);

  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`Staged upload POST failed [${res.status}]: ${await res.text()}`);
  }
}

async function finalizeFile(resourceUrl: string): Promise<string> {
  const created = await adminGraphqlFetch<{
    data?: {
      fileCreate?: {
        files?: Array<{ id: string; fileStatus: string }>;
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: Array<{ message?: string }>;
  }>(FILE_CREATE, {
    files: [{ originalSource: resourceUrl, contentType: 'IMAGE' }],
  });

  if (created.errors?.length) throw new Error(created.errors[0]?.message || 'fileCreate failed');
  const fc = created.data?.fileCreate;
  if (fc?.userErrors?.length) throw new Error(fc.userErrors.map((e) => e.message).join('; '));
  const fileId = fc?.files?.[0]?.id;
  if (!fileId) throw new Error('fileCreate returned no file id');

  // Shopify processes the image asynchronously; poll for the CDN url.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await sleep(attempt === 0 ? 400 : 700);
    const node = await adminGraphqlFetch<{
      data?: { node?: { fileStatus?: string; image?: { url?: string | null } | null } | null };
    }>(FILE_NODE, { id: fileId });
    const url = node.data?.node?.image?.url;
    const status = node.data?.node?.fileStatus;
    if (url && status === 'READY') return url;
    if (status === 'FAILED') throw new Error('Shopify image processing failed');
  }
  throw new Error('Timed out waiting for Shopify image processing');
}

/** Upload one image and return its public Shopify CDN URL. */
export async function uploadReviewImage(image: UploadableImage): Promise<string> {
  const target = await createStagedTarget(image);
  await putBytesToTarget(target, image);
  return finalizeFile(target.resourceUrl);
}

/**
 * Same operation as {@link uploadReviewImage} — upload an image to Shopify Files
 * and get back a public CDN URL. Aliased for callers outside the reviews flow
 * (e.g. Fit Guarantee claim photos).
 */
export const uploadPublicImage = uploadReviewImage;
