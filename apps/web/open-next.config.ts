import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// R2-backed ISR cache can be added later; start with the default in-memory/none cache.
export default defineCloudflareConfig({});
