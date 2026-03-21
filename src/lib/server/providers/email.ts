import { config } from "@/lib/server/config";
import type { IEmailProvider } from "@/lib/server/interfaces";
import { resend } from "@/lib/server/resend/client";
import { ResendEmailProvider } from "./ResendEmailProvider";

export const emailProvider: IEmailProvider = new ResendEmailProvider(resend, {
	appName: config.appName,
	domainName: config.domainName,
	logoUrl: config.logoUrl,
});
