import { config } from "../../config";
import { resend } from "../client";
import { baseEmailTemplate } from "./baseEmailTemplate";

interface SendVerificationCodeParams {
	to: string;
	code: string;
}

export async function sendVerificationCodeEmail({
	to,
	code,
}: SendVerificationCodeParams) {
	const body = `
    <p style="font-size:16px; color:#111827;">Enter this code to sign in</p>

    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
      <tr>
        <td style="padding:16px 32px; background-color:#f3f4f6; border-radius:8px;
                   font-size:32px; font-weight:700; letter-spacing:8px; color:#111827; text-align:center;">
          ${code}
        </td>
      </tr>
    </table>

    <p style="font-size:14px; color:#374151;">
      Enter the code above on your device to sign in to ${config.appName}. This code will expire in 10 minutes.
    </p>

    <p style="font-size:14px; color:#6b7280;">
      If you didn&rsquo;t make this request, you can safely ignore this email.
    </p>

    <p style="font-size:13px; color:#6b7280;">
      For security reasons, never share this code with anyone.
    </p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

    <p style="font-size:13px; color:#9ca3af;">
      The ${config.appName} Team
    </p>
  `;

	const html = baseEmailTemplate({
		title: "Sign-In Code",
		heading: "Your Sign-In Code",
		body,
	});

	return resend.emails.send({
		from: `${config.appName} <security@${config.domainName}>`,
		to,
		subject: `${config.appName} : Your sign-in code`,
		html,
	});
}
