import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "VAKANSISME <noreply@vakansisme.club>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vakansisme.club";

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

export async function sendLeaderJoinEmail(
  to: string,
  leaderUsername: string,
  memberUsername: string,
  tripName: string,
  tripId: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `@${memberUsername} joined your trip — ${tripName}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9BFF3C;text-transform:uppercase;">NEW CREW MEMBER</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${tripName}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          Hey @${leaderUsername}, <strong style="color:#F0EDEA;">@${memberUsername}</strong> just joined your expedition.
        </p>
        <a href="${SITE_URL}/expeditions/${tripId}" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">
          VIEW EXPEDITION →
        </a>
      </td></tr>
    `),
  });
}

export async function sendGalleryStatusEmail(
  to: string,
  username: string,
  status: "approved" | "rejected",
  tripName: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  const approved = status === "approved";
  await resend.emails.send({
    from: FROM,
    to,
    subject: approved ? `Your photo is live — ${tripName}` : `Photo update — ${tripName}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:${approved ? "#9BFF3C" : "#FF6B1A"};text-transform:uppercase;">
          PHOTO ${approved ? "APPROVED" : "NOT APPROVED"}
        </p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${tripName}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          ${approved
            ? `Hey @${username}, your photo is now live in the trip gallery.`
            : `Hey @${username}, your photo wasn't approved for the gallery this time.`
          }
        </p>
        <a href="${SITE_URL}" style="display:inline-block;background:${approved ? "#9BFF3C" : "rgba(255,107,26,0.15)"};color:${approved ? "#111111" : "#FF6B1A"};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;${approved ? "" : "border:1px solid rgba(255,107,26,0.4);"}">
          VIEW EXPEDITIONS →
        </a>
      </td></tr>
    `),
  });
}

export async function sendExpeditionStatusEmail(
  to: string,
  username: string,
  tripName: string,
  tripId: string,
  newStatus: "cancelled" | "ongoing" | "completed"
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  const cfg = {
    cancelled: {
      label: "EXPEDITION CANCELLED",
      color: "#FF6B1A",
      body: `Hey @${username}, unfortunately <strong style="color:#F0EDEA;">${tripName}</strong> has been cancelled. Contact the leader for details.`,
      btnBg: "rgba(255,107,26,0.15)",
      btnColor: "#FF6B1A",
      btnBorder: "border:1px solid rgba(255,107,26,0.4);",
      subject: `Expedition cancelled — ${tripName}`,
    },
    ongoing: {
      label: "TRIP IS LIVE",
      color: "#FF6B1A",
      body: `Hey @${username}, <strong style="color:#F0EDEA;">${tripName}</strong> is now officially underway. Stay safe and enjoy the chaos.`,
      btnBg: "#FF6B1A",
      btnColor: "#111111",
      btnBorder: "",
      subject: `Trip underway — ${tripName}`,
    },
    completed: {
      label: "TRIP COMPLETED",
      color: "#9BFF3C",
      body: `Hey @${username}, <strong style="color:#F0EDEA;">${tripName}</strong> is complete. Head back to rate the trip and add your gallery photos.`,
      btnBg: "#9BFF3C",
      btnColor: "#111111",
      btnBorder: "",
      subject: `Trip complete — ${tripName}`,
    },
  }[newStatus];

  await resend.emails.send({
    from: FROM,
    to,
    subject: cfg.subject,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:${cfg.color};text-transform:uppercase;">${cfg.label}</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${tripName}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">${cfg.body}</p>
        <a href="${SITE_URL}/expeditions/${tripId}" style="display:inline-block;background:${cfg.btnBg};color:${cfg.btnColor};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;${cfg.btnBorder}">
          VIEW EXPEDITION →
        </a>
      </td></tr>
    `),
  });
}

export async function sendAdminProposalEmail(to: string[], proposerHandle: string, tripName: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  if (!to.length) return;
  await resend.batch.send(to.map((email) => ({
    from: FROM,
    to: email,
    subject: `New trip proposal — ${tripName}`,
    html: base(`
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;letter-spacing:-0.025em;color:#F0EDEA;text-transform:uppercase;">NEW PROPOSAL</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">@${proposerHandle} submitted a trip proposal: <strong style="color:#F0EDEA;">${tripName}</strong>. Review it in the admin panel.</p>
        <a href="${SITE_URL}/admin" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">REVIEW PROPOSAL →</a>
      </td></tr>
    `),
  })));
}

export async function sendProposalApprovedEmail(to: string, username: string, tripName: string, expeditionId: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your trip is live — ${tripName}`,
    html: base(`
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;letter-spacing:-0.025em;color:#F0EDEA;text-transform:uppercase;">TRIP APPROVED</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">Hey @${username}, your proposal <strong style="color:#F0EDEA;">${tripName}</strong> has been approved and is now live on VAKANSISME.</p>
        <a href="${SITE_URL}/expeditions/${expeditionId}" style="display:inline-block;background:#9BFF3C;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">VIEW YOUR TRIP →</a>
      </td></tr>
    `),
  });
}

export async function sendProposalRejectedEmail(to: string, username: string, tripName: string, note?: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Trip proposal update — ${tripName}`,
    html: base(`
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;letter-spacing:-0.025em;color:#F0EDEA;text-transform:uppercase;">PROPOSAL UPDATE</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8B7355;">Hey @${username}, we reviewed your proposal for <strong style="color:#F0EDEA;">${tripName}</strong> and couldn't greenlight it at this time.</p>
        ${note ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#8B7355;padding:14px;border-left:3px solid #4A3B2A;">${note}</p>` : ""}
        <a href="${SITE_URL}/expeditions/propose" style="display:inline-block;background:transparent;color:#9BFF3C;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;border:1px solid #9BFF3C;">SUBMIT ANOTHER PROPOSAL →</a>
      </td></tr>
    `),
  });
}

export async function sendReminderEmail(
  to: string,
  username: string,
  tripName: string,
  tripId: string,
  days: number
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${tripName} departs in ${days} day${days !== 1 ? "s" : ""}`,
    html: base(`
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#FF6B1A;text-transform:uppercase;">TRIP REMINDER</p>
        <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;letter-spacing:-0.025em;line-height:0.9;color:#F0EDEA;text-transform:uppercase;">
          ${tripName}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#8B7355;">
          Hey @${username}, <strong style="color:#F0EDEA;">${tripName}</strong> departs in <strong style="color:#FF6B1A;">${days} day${days !== 1 ? "s" : ""}</strong>. Make sure you're prepared.
        </p>
        <a href="${SITE_URL}/expeditions/${tripId}" style="display:inline-block;background:#FF6B1A;color:#111111;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">
          VIEW EXPEDITION →
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
