import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: false,
	turbopack: true,
	serverExternalPackages: ["typescript", "twoslash"],
	async rewrites() {
		return [
			{
				source: "/campaign/subscribe",
				destination: "https://motia-hub-api.motiahub.com/campaign/subscribe",
			},
		];
	},
};

export default withMDX(config);
