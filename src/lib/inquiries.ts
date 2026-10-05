export type InquiryKind = "project" | "grievance";

export type Inquiry = {
	id: string;
	kind: InquiryKind;
	phone: string;
	query: string;
	createdAt: string;
};

type Statement = {
	bind(...values: unknown[]): Statement;
	run(): Promise<unknown>;
	all<T>(): Promise<{ results?: T[] }>;
};

export type InquiryDatabase = {
	prepare(query: string): Statement;
};

const schema = `CREATE TABLE IF NOT EXISTS inquiries (
	id TEXT PRIMARY KEY,
	phone TEXT NOT NULL,
	query TEXT NOT NULL,
	created_at TEXT NOT NULL
)`;

export function inquiryKind(value: unknown): InquiryKind {
	return value === "grievance" ? "grievance" : "project";
}

export async function ensureInquiries(db: InquiryDatabase) {
	await db.prepare(schema).run();
	const info = await db
		.prepare("PRAGMA table_info(inquiries)")
		.all<{ name: string }>();
	const names = new Set((info.results ?? []).map((column) => column.name));
	if (!names.has("kind")) {
		await db
			.prepare(
				"ALTER TABLE inquiries ADD COLUMN kind TEXT NOT NULL DEFAULT 'project'",
			)
			.run();
	}
}

export function readInquiry(
	phoneRaw: string,
	queryRaw: string,
): { phone: string; query: string } | { error: "phone" | "query" } {
	const phone = phoneRaw.trim();
	const query = queryRaw.trim().replace(/\r\n/g, "\n");
	const digits = phone.replace(/\D/g, "");
	const phoneOk =
		digits.length >= 7 &&
		digits.length <= 15 &&
		/^[+]?\d[\d\s().-]{6,22}$/.test(phone);

	if (!phoneOk) return { error: "phone" };
	if (query.length < 1 || query.length > 2000) return { error: "query" };
	return { phone, query };
}

export async function saveInquiry(
	db: InquiryDatabase,
	phone: string,
	query: string,
	kind: InquiryKind,
) {
	await ensureInquiries(db);
	await db
		.prepare(
			"INSERT INTO inquiries (id, phone, query, created_at, kind) VALUES (?, ?, ?, ?, ?)",
		)
		.bind(crypto.randomUUID(), phone, query, new Date().toISOString(), kind)
		.run();
}

export async function listInquiries(db: InquiryDatabase): Promise<Inquiry[]> {
	await ensureInquiries(db);
	const { results } = await db
		.prepare(
			"SELECT id, phone, query, created_at, kind FROM inquiries ORDER BY created_at DESC LIMIT 200",
		)
		.all<{
			id: string;
			phone: string;
			query: string;
			created_at: string;
			kind: string | null;
		}>();

	return (results ?? []).map((row) => ({
		id: row.id,
		kind: inquiryKind(row.kind),
		phone: row.phone,
		query: row.query,
		createdAt: row.created_at,
	}));
}
