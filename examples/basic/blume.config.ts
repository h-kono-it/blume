import { defineConfig } from "blume";

export default defineConfig({
  ai: {
    llmsTxt: true,
  },
  deployment: {
    site: "https://docs.example.com",
  },
  description: "Example documentation built with Blume.",
  og: {
    enabled: true,
  },
  redirects: [{ from: "/intro", to: "/" }],
  theme: {
    accent: "teal",
  },
  title: "Blume Docs",
});
