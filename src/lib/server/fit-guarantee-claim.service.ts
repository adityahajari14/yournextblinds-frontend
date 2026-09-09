// ============================================
// Your Next Fit Guarantee™ claim intake (email-only)
// ============================================
//
// No database and no admin dashboard by design: a claim is a set of validated
// fields plus photos. Photos are uploaded to Shopify Files for durable public
// URLs, then the whole claim is emailed to the support inbox.

import { uploadPublicImage } from './shopify-files.service';
import { emailConfig, isEmailConfigured, sendEmail } from './email';

export class FitGuaranteeClaimError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'FitGuaranteeClaimError';
    this.statusCode = statusCode;
  }
}

export interface FitGuaranteeClaimInput {
  orderNumber: string;
  customerName: string;
  email: string;
  telephone: string;
  product: string;
  originalWidth: string;
  originalHeight: string;
  correctWidth: string;
  correctHeight: string;
  problem: string;
  videoLink?: string;
  photos: {
    windowPhoto: File | null;
    widthPhoto: File | null;
    heightPhoto: File | null;
    additional: File[];
  };
}

async function toCdnUrl(file: File, label: string): Promise<{ label: string; url: string }> {
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const url = await uploadPublicImage({
    filename: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
    mimeType: file.type,
    bytes: await file.arrayBuffer(),
  });
  return { label, url };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Upload the claim photos and email the claim to the support inbox. */
export async function submitFitGuaranteeClaim(input: FitGuaranteeClaimInput): Promise<void> {
  if (!isEmailConfigured()) {
    throw new FitGuaranteeClaimError('Fit Guarantee claims are temporarily unavailable.', 503);
  }

  const uploads: Array<Promise<{ label: string; url: string }>> = [];
  if (input.photos.windowPhoto) uploads.push(toCdnUrl(input.photos.windowPhoto, 'Blind at the window'));
  if (input.photos.widthPhoto) uploads.push(toCdnUrl(input.photos.widthPhoto, 'Correct width measurement'));
  if (input.photos.heightPhoto) uploads.push(toCdnUrl(input.photos.heightPhoto, 'Correct height measurement'));
  input.photos.additional.forEach((file, i) => uploads.push(toCdnUrl(file, `Additional photo ${i + 1}`)));

  let photoLinks: Array<{ label: string; url: string }>;
  try {
    photoLinks = await Promise.all(uploads);
  } catch (err) {
    console.error('Fit Guarantee claim photo upload failed:', err instanceof Error ? err.message : err);
    throw new FitGuaranteeClaimError(
      'Could not process your photos. Please try again in a moment.',
      502
    );
  }

  const rows: Array<[string, string]> = [
    ['Order number', input.orderNumber],
    ['Customer name', input.customerName],
    ['Email', input.email],
    ['Telephone', input.telephone],
    ['Product', input.product],
    ['Original width', input.originalWidth],
    ['Original height', input.originalHeight],
    ['Correct width', input.correctWidth],
    ['Correct height', input.correctHeight],
  ];
  if (input.videoLink) rows.push(['Video link', input.videoLink]);

  const textLines = [
    'New Your Next Fit Guarantee claim',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Describe the problem:',
    input.problem,
    '',
    'Photos:',
    ...(photoLinks.length
      ? photoLinks.map((p) => `- ${p.label}: ${p.url}`)
      : ['- None provided']),
    '',
    'Customer confirmed the corrected measurements have been checked and are accurate: Yes',
  ];

  const html = `
    <h2>New Your Next Fit Guarantee&trade; claim</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="color:#555">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`
        )
        .join('')}
    </table>
    <h3>Describe the problem</h3>
    <p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(input.problem)}</p>
    <h3>Photos</h3>
    <ul style="font-family:system-ui,sans-serif;font-size:14px">
      ${
        photoLinks.length
          ? photoLinks
              .map((p) => `<li>${escapeHtml(p.label)}: <a href="${p.url}">${p.url}</a></li>`)
              .join('')
          : '<li>None provided</li>'
      }
    </ul>
    <p style="font-family:system-ui,sans-serif;font-size:13px;color:#555">
      Customer confirmed the corrected measurements have been checked and are accurate.
    </p>
  `;

  try {
    await sendEmail({
      to: emailConfig.fitGuaranteeInbox,
      subject: `Fit Guarantee claim — order ${input.orderNumber} (${input.customerName})`,
      text: textLines.join('\n'),
      html,
      replyTo: input.email,
    });
  } catch (err) {
    console.error('Fit Guarantee claim email failed:', err instanceof Error ? err.message : err);
    throw new FitGuaranteeClaimError('Could not submit your claim. Please try again.', 502);
  }
}
