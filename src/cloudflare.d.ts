interface KmosBindings {
	DB: import("./lib/inquiries").InquiryDatabase;
	ADMIN_USER?: string;
	ADMIN_PASSWORD?: string;
}

declare module "cloudflare:workers" {
	export const env: KmosBindings;
}
