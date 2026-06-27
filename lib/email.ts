import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "VAKANSISME <noreply@vakansisme.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.com";

export async function sendWelcomeEmail(to: string, username: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to VAKANSISME",
    html: welcomeHtml(username),
  });
}

export async function sendJoinConfirmationEmail(
  to: string,
  username: string,
  tripName: string,
  tripLocation: string,
  dateStart: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're in — ${tripName}`,
    html: joinHtml(username, tripName, tripLocation, dateStart),
  });
}

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VAKANSISME</title></head>
<body style="margin:0;padding:0;background:#111111;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:13px;font-weight:900;letter-spacing:0.2em;color:#F0EDEA;text-transform:uppercase;">VAKANSISME</p>
        </td></tr>
        ${content}
        <tr><td style="padding-top:40px;border-top:1px solid rgba(74,59,42,0.3);">
          <p style="margin:0;font-size:11px;color:#4A3B2A;letter-spacing:0.05em;">
            Not your average trip. Organized escapes with a controlled dose of chaos.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeHtml(username: string) {
  return base(`
    <tr><td>
      <h1 style="margin:0 0 16px;font-size:48px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
        WELCOME,<br>@${username}
      </h1>
      <p style="margin:24px 0;font-size:15px;line-height:1.7;color:#8B7355;">
        You've joined the crew. Browse upcoming expeditions, read field dispatches, and post to the chaos wall.
      </p>
      <a href="${SITE_URL}" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;margin-top:8px;">
        EXPLORE EXPEDITIONS →
      </a>
    </td></tr>
  `);
}

export async function sendStoryApprovedEmail(to: string, username: string, storyTitle: string, storyId: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your story is live — ${storyTitle}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9BFF3C;text-transform:uppercase;">STORY APPROVED</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${storyTitle}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          Hey @${username}, your story just went live on VAKANSISME. The crew can read it now.
        </p>
        <a href="${SITE_URL}/stories/${storyId}" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">
          VIEW STORY →
        </a>
      </td></tr>
    `),
  });
}

export async function sendStoryRejectedEmail(to: string, username: string, storyTitle: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Story update — ${storyTitle}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#FF6B1A;text-transform:uppercase;">STORY NOT APPROVED</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${storyTitle}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          Hey @${username}, your story wasn't approved this time. You can edit and resubmit from your profile page.
        </p>
        <a href="${SITE_URL}/settings" style="display:inline-block;background:rgba(255,107,26,0.15);color:#FF6B1A;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border:1px solid rgba(255,107,26,0.4);">
          GO TO PROFILE →
        </a>
      </td></tr>
    `),
  });
}

export async function sendNewsletterEmail(to: string[], subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return { sent: 0 };
  const batches = [];
  for (let i = 0; i < to.length; i += 50) {
    batches.push(to.slice(i, i + 50));
  }
  let sent = 0;
  for (const batch of batches) {
    await resend.batch.send(
      batch.map((email) => ({ from: FROM, to: email, subject, html }))
    );
    sent += batch.length;
  }
  return { sent };
}

function joinHtml(username: string, tripName: string, tripLocation: string, dateStart: string) {
  const dateStr = new Date(dateStart).toLocaleDateString("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return base(`
    <tr><td>
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9BFF3C;text-transform:uppercase;">EXPEDITION CONFIRMED</p>
      <h1 style="margin:0 0 8px;font-size:42px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
        ${tripName}
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#8B7355;">${tripLocation}</p>

      <table style="border:1px solid rgba(74,59,42,0.35);background:#1a1a1a;padding:24px;width:100%;margin-bottom:28px;">
        <tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#4A3B2A;text-transform:uppercase;padding-bottom:4px;">DEPARTURE</td>
        </tr>
        <tr>
          <td style="font-size:16px;font-weight:600;color:#F0EDEA;">${dateStr}</td>
        </tr>
      </table>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
        Hey @${username}, you're on the crew list for <strong style="color:#F0EDEA;">${tripName}</strong>. We'll send updates as departure approaches.
      </p>
      <a href="${SITE_URL}" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">
        VIEW EXPEDITION →
      </a>
    </td></tr>
  `);
}
