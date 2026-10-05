import type { APIRoute } from "astro";
import { inquiryKind, readInquiry } from "../../lib/inquiries";
import { persistInquiry } from "../../lib/store";

export const prerender = false;

function back(
	kind: "project" | "grievance",
	error?: "phone" | "query" | "save",
) {
	const path = kind === "grievance" ? "/grievance" : "/start";
	const target = error ? `${path}?error=${error}` : `${path}?sent=1`;
	return new Response(null, {
		status: 303,
		headers: { Location: target },
	});
}

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const kind = inquiryKind(form.get("kind"));
	const parsed = readInquiry(
		String(form.get("phone") ?? ""),
		String(form.get("query") ?? ""),
	);
	if ("error" in parsed) return back(kind, parsed.error);

	try {
		await persistInquiry(parsed.phone, parsed.query, kind);
	} catch (err) {
		console.error("inquiry save failed", err);
		return back(kind, "save");
	}

	return back(kind);
};
