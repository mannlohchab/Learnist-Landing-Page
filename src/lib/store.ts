import {
	listInquiries,
	saveInquiry,
	type Inquiry,
	type InquiryKind,
} from "./inquiries";

async function workersEnv() {
	const spec = "cloudflare:workers";
	const mod = (await import(/* @vite-ignore */ spec)) as {
		env: {
			DB: import("./inquiries").InquiryDatabase;
			ADMIN_USER?: string;
			ADMIN_PASSWORD?: string;
		};
	};
	return mod.env;
}

export async function persistInquiry(
	phone: string,
	query: string,
	kind: InquiryKind,
) {
	if (import.meta.env.DEV) {
		const file = await import("./file-store");
		await file.saveFile(phone, query, kind);
		return;
	}
	const env = await workersEnv();
	await saveInquiry(env.DB, phone, query, kind);
}

export async function loadInquiries(): Promise<Inquiry[]> {
	if (import.meta.env.DEV) {
		const file = await import("./file-store");
		return file.listFile();
	}
	const env = await workersEnv();
	return listInquiries(env.DB);
}

export async function adminCredentials() {
	if (import.meta.env.DEV) {
		return {
			user: import.meta.env.ADMIN_USER || process.env.ADMIN_USER || "",
			pass:
				import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "",
		};
	}
	const env = await workersEnv();
	return {
		user: env.ADMIN_USER ?? "",
		pass: env.ADMIN_PASSWORD ?? "",
	};
}
