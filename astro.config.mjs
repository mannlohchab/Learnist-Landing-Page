// @ts-check
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

const building = process.argv.includes("build");

// Dev stays on the Vite server so the form works without the Workers runtime.
// `astro build` attaches the Cloudflare adapter for the Worker deploy.
export default defineConfig({
	session: false,
	...(building
		? {
				adapter: cloudflare({
					imageService: "passthrough",
					// Static pages prerender in Node. The Workers runtime hangs
					// during local prerender on this machine.
					prerenderEnvironment: "node",
				}),
			}
		: {}),
});
