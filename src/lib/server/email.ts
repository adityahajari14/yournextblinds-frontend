// Server-only transactional email via the Resend REST API.
//
// Kept dependency-free on purpose — a single `fetch` to Resend is all we need,
// so there is no SDK in the bundle. Configure with env vars:
//   RESEND_API_KEY     - Resend API key (required to actually send)
//   EMAIL_FROM         - verified sender, e.g. "Your Next Blinds <claims@yournextblinds.com>"
//   FIT_GUARANTEE_INBOX - where Fit Guarantee claims are sent (defaults to enquiries@)
//
// When RESEND_API_KEY / EMAIL_FROM are unset, `isEmailConfigured()` is false and
// callers should degrade gracefully (e.g. return 503) rather than throwing.

export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY || '',
  from: process.env.EMAIL_FROM || '',
  fitGuaranteeInbox: process.env.FIT_GUARANTEE_INBOX || 'enquiries@yournextblinds.com',
};

export function isEmailConfigured(): boolean {
  return Boolean(emailConfig.resendApiKey && emailConfig.from);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Send one email through Resend. Throws on missing config or a non-2xx response. */
export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailInput): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${emailConfig.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailConfig.from,
      to: [to],
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed [${res.status}]: ${detail.slice(0, 300)}`);
  }
}
