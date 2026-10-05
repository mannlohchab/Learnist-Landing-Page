import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { inquiryKind, type Inquiry, type InquiryKind } from "./inquiries";

const file = join(process.cwd(), ".data", "inquiries.json");

export async function listFile(): Promise<Inquiry[]> {
	try {
		const raw = await readFile(file, "utf8");
		const parsed = JSON.parse(raw) as Inquiry[];
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item) => ({
			...item,
			kind: inquiryKind(item.kind),
		}));
	} catch {
		return [];
	}
}

export async function saveFile(
	phone: string,
	query: string,
	kind: InquiryKind,
) {
	const all = await listFile();
	all.unshift({
		id: crypto.randomUUID(),
		kind,
		phone,
		query,
		createdAt: new Date().toISOString(),
	});
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, JSON.stringify(all.slice(0, 200), null, 2));
}
