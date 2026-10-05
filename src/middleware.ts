import { defineMiddleware } from "astro:middleware";
import { adminCredentials } from "./lib/store";

function unauthorized(): Response {
	return new Response("Authentication required.", {
		status: 401,
		headers: {
			"WWW-Authenticate": 'Basic realm="kmos", charset="UTF-8"',
			"Cache-Control": "no-store",
		},
	});
}

function sameSecret(given: string, expected: string): boolean {
	const enc = new TextEncoder();
	const left = enc.encode(given);
	const right = enc.encode(expected);
	const len = Math.max(left.length, right.length);
	let diff = left.length === right.length ? 0 : 1;
	for (let i = 0; i < len; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
	return diff === 0;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = new URL(context.request.url);
	if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return next();

	const { user, pass } = await adminCredentials();
	if (!user || !pass) return unauthorized();

	const header = context.request.headers.get("authorization") ?? "";
	const space = header.indexOf(" ");
	const scheme = space === -1 ? "" : header.slice(0, space);
	const encoded = space === -1 ? "" : header.slice(space + 1);
	if (scheme !== "Basic" || !encoded) return unauthorized();

	let decoded = "";
	try {
		decoded = atob(encoded);
	} catch {
		return unauthorized();
	}

	const sep = decoded.indexOf(":");
	if (sep < 0) return unauthorized();
	const givenUser = decoded.slice(0, sep);
	const givenPass = decoded.slice(sep + 1);
	if (!sameSecret(givenUser, user) || !sameSecret(givenPass, pass)) {
		return unauthorized();
	}

	const response = await next();
	response.headers.set("Cache-Control", "no-store");
	return response;
});
