#!/usr/bin/env node
/**
 * Consumer smoke test — the acceptance proof for SPEC.md §7.3.
 *
 * "The registry item installs cleanly" is not something you can assert by
 * reading registry.json. This scaffolds a real, empty SvelteKit consumer in a
 * throwaway directory, serves this repo's built registry over loopback HTTP,
 * runs the actual `shadcn-svelte add` a user would run, then checks that the
 * files landed where the item said they would and that the project still
 * builds. Nothing is mocked.
 *
 *   pnpm consumer:smoke
 *
 * Slow by design (it does a full scaffold + install), so CI runs it on demand
 * rather than on every push. Zero dependencies, ESM.
 *
 * Notes for anyone editing this:
 *   - The sv and shadcn-svelte CLIs are interactive and will hang forever on a
 *     TTY-less stdin that never closes. Every child gets piped stdin and a
 *     timeout.
 *   - The server binds 127.0.0.1 only. Never 0.0.0.0 — see AGENT-BASELINE §2.3.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_DIR = join(ROOT, "static");

/** The style/base-color/icon preset that matches this repo's components.json. */
const PRESET = "bIkeymG";

/** Generous: a cold `sv create` plus a full pnpm install is not fast. */
const STEP_TIMEOUT_MS = 10 * 60 * 1000;

const CONTENT_TYPES = {
	".json": "application/json; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".html": "text/html; charset=utf-8"
};

let stepNumber = 0;
function step(message) {
	stepNumber += 1;
	console.log(`\n── ${stepNumber}. ${message}`);
}

function info(message) {
	console.log(`   ${message}`);
}

/**
 * Runs a command to completion, streaming its output through with a prefix.
 *
 * stdin is piped and kept open for the life of the child, with `y\n` written on
 * a timer. Both matter, and both were learned the hard way:
 *
 *   - Closing stdin immediately makes @clack/prompts read EOF and *cancel* the
 *     prompt. `shadcn-svelte init` then exits 0 having silently skipped the
 *     "Updates to your src/app.css are required. Continue?" step, so the run
 *     looks green and nothing was written.
 *   - Not writing anything at all hangs until the timeout.
 *
 * Flags cover the prompts that have flags (`sv add tailwindcss=plugins:none`,
 * `shadcn-svelte add -y`); the stylesheet confirmation has none, so it is
 * answered here.
 */
function run(command, args, { cwd, input = "y\n", timeout = STEP_TIMEOUT_MS, env } = {}) {
	return new Promise((resolvePromise, rejectPromise) => {
		info(`$ ${command} ${args.join(" ")}`);
		const child = spawn(command, args, {
			cwd,
			env: { ...process.env, ...env },
			stdio: ["pipe", "pipe", "pipe"]
		});
		// A closed pipe when the child exits mid-write is expected, not a failure.
		child.stdin.on("error", () => {});

		let output = "";
		const capture = (chunk) => {
			const text = chunk.toString();
			output += text;
			process.stdout.write(
				text
					.split("\n")
					.map((line) => (line ? `   │ ${line}` : ""))
					.join("\n")
			);
		};
		child.stdout.on("data", capture);
		child.stderr.on("data", capture);

		const nudge = setInterval(() => {
			if (!child.stdin.destroyed && child.stdin.writable) child.stdin.write(input);
		}, 700);

		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			rejectPromise(
				new Error(
					`Timed out after ${timeout / 1000}s: ${command} ${args.join(" ")}\n` +
						`Output so far:\n${output}`
				)
			);
		}, timeout);

		child.on("error", (error) => {
			clearTimeout(timer);
			clearInterval(nudge);
			rejectPromise(error);
		});

		child.on("close", (code, signal) => {
			clearTimeout(timer);
			clearInterval(nudge);
			if (code === 0) {
				resolvePromise(output);
				return;
			}
			rejectPromise(
				new Error(
					`Exit ${code ?? signal}: ${command} ${args.join(" ")}\n` +
						`Full output:\n${output}`
				)
			);
		});
	});
}

/** Static file server over loopback, on a kernel-assigned port. */
function serveStatic(directory) {
	return new Promise((resolvePromise, rejectPromise) => {
		const server = createServer((request, response) => {
			// Path traversal guard: a smoke test is not a reason to expose the disk.
			const requestPath = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
			const filePath = normalize(join(directory, requestPath));
			if (filePath !== directory && !filePath.startsWith(directory + sep)) {
				response.writeHead(403).end("Forbidden");
				return;
			}
			const extension = filePath.slice(filePath.lastIndexOf("."));
			response.writeHead(200, {
				"content-type": CONTENT_TYPES[extension] ?? "application/octet-stream"
			});
			createReadStream(filePath)
				.on("error", () => {
					response.writeHead(404).end("Not found");
				})
				.pipe(response);
		});
		server.on("error", rejectPromise);
		server.listen(0, "127.0.0.1", () => {
			resolvePromise({ server, port: server.address().port });
		});
	});
}

async function exists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

const failures = [];
function assert(condition, message) {
	if (condition) {
		info(`   ✓ ${message}`);
	} else {
		failures.push(message);
		info(`   ✗ ${message}`);
	}
}

let server = null;
let consumerDir = null;

async function cleanup() {
	if (server) {
		await new Promise((done) => server.close(done));
		server = null;
	}
	if (consumerDir) {
		await rm(consumerDir, { recursive: true, force: true });
		info(`removed ${consumerDir}`);
		consumerDir = null;
	}
}

async function main() {
	step("Build the registry");
	await run("pnpm", ["registry:build"], { cwd: ROOT });

	step("Serve static/ over loopback HTTP");
	const served = await serveStatic(STATIC_DIR);
	server = served.server;
	const origin = `http://127.0.0.1:${served.port}`;
	info(`listening on ${origin} (loopback only)`);

	const probe = await fetch(`${origin}/r/theme.json`);
	if (!probe.ok) throw new Error(`registry not reachable at ${origin}/r/theme.json (${probe.status})`);
	info(`GET /r/theme.json → ${probe.status}`);

	step("Scaffold a throwaway consumer");
	// /var/tmp rather than /tmp: the scaffold plus node_modules is hundreds of MB
	// and /tmp is frequently a small tmpfs.
	const base = (await exists("/var/tmp")) ? "/var/tmp" : tmpdir();
	consumerDir = await mkdtemp(join(base, "alrein-consumer-"));
	info(consumerDir);

	await run(
		"pnpm",
		[
			"dlx",
			"sv@latest",
			"create",
			".",
			"--template",
			"minimal",
			"--types",
			"ts",
			"--no-add-ons",
			"--install",
			"pnpm",
			"--no-dir-check"
		],
		{ cwd: consumerDir }
	);

	step("Add Tailwind to the consumer");
	// `tailwindcss=plugins:none` is required, not cosmetic: bare `tailwindcss`
	// still opens the plugin multiselect, and a cancelled prompt exits 0 without
	// installing anything. `sv add --help` states the rule — to skip prompts,
	// every option must be set explicitly.
	await run(
		"pnpm",
		[
			"dlx",
			"sv@latest",
			"add",
			"tailwindcss=plugins:none",
			"--install",
			"pnpm",
			"--no-git-check",
			"--no-download-check"
		],
		{ cwd: consumerDir }
	);

	// Exit 0 is not proof the add-on ran, for the reason above.
	const consumerPkg = JSON.parse(await readFile(join(consumerDir, "package.json"), "utf8"));
	const consumerDeps = { ...consumerPkg.dependencies, ...consumerPkg.devDependencies };
	if (!consumerDeps.tailwindcss) {
		throw new Error(
			"`sv add tailwindcss` exited 0 but tailwindcss is not in the consumer's package.json — " +
				"a prompt was almost certainly cancelled by the closed stdin."
		);
	}
	info(`tailwindcss ${consumerDeps.tailwindcss} installed`);

	step("Normalise the global stylesheet to src/app.css");
	// sv 0.17 puts the Tailwind entry at src/routes/layout.css. shadcn-svelte's
	// own default — and this repo's components.json — is src/app.css, and that
	// matters beyond taste: the theme item's css payload injects
	// `@import "./lib/styles/alrein/index.css"`, which is resolved relative to
	// the file it is injected into. From src/app.css that is src/lib/styles/…
	// (correct); from src/routes/layout.css it would be src/routes/lib/styles/…
	// (a 404 at build time). So the consumer is moved onto the convention the
	// registry documents, rather than the registry being bent to the scaffold.
	const scaffoldCss = join(consumerDir, "src", "routes", "layout.css");
	const appCssPath = join(consumerDir, "src", "app.css");
	if ((await exists(scaffoldCss)) && !(await exists(appCssPath))) {
		await rename(scaffoldCss, appCssPath);
		const layoutPath = join(consumerDir, "src", "routes", "+layout.svelte");
		const layout = await readFile(layoutPath, "utf8");
		await writeFile(layoutPath, layout.replace("./layout.css", "../app.css"), "utf8");
		info("moved src/routes/layout.css → src/app.css and repointed +layout.svelte");
	}
	if (!(await exists(appCssPath))) {
		throw new Error("consumer has no src/app.css after the Tailwind add-on ran");
	}

	step("Initialise shadcn-svelte in the consumer");
	await run(
		"pnpm",
		[
			"dlx",
			"shadcn-svelte@latest",
			"init",
			"--preset",
			PRESET,
			"--css",
			"src/app.css",
			"--components-alias",
			"$lib/components",
			"--lib-alias",
			"$lib",
			"--utils-alias",
			"$lib/utils",
			"--hooks-alias",
			"$lib/hooks",
			"--ui-alias",
			"$lib/components/ui"
		],
		{ cwd: consumerDir }
	);

	step("Install the theme item from the local registry");
	await run("pnpm", ["dlx", "shadcn-svelte@latest", "add", `${origin}/r/theme.json`, "-y"], {
		cwd: consumerDir
	});

	step("Assert the item landed where registry.json said it would");
	const registry = JSON.parse(await readFile(join(ROOT, "registry.json"), "utf8"));
	const theme = registry.items.find((item) => item.name === "theme");
	if (!theme) throw new Error("registry.json has no item named 'theme'");

	for (const file of theme.files) {
		// `~/` in a target means the consumer's project root.
		const relative = file.target.replace(/^~\//, "");
		const installed = join(consumerDir, relative);
		const landed = await exists(installed);
		assert(landed, `${relative} exists`);
		if (!landed) continue;
		const expected = await readFile(join(ROOT, file.path), "utf8");
		const actual = await readFile(installed, "utf8");
		assert(actual.trim() === expected.trim(), `${relative} matches the source file byte for byte`);
	}

	// The `css` field with an `@import "…"` key is how the CLI injects an import
	// into the consumer's app.css. This is the assertion that proves it.
	const appCss = await readFile(join(consumerDir, "src", "app.css"), "utf8");
	const importPattern = /@import\s+["']\.\/lib\/styles\/alrein\/index\.css["']/;
	assert(
		importPattern.test(appCss),
		'src/app.css contains @import "./lib/styles/alrein/index.css"'
	);
	if (!importPattern.test(appCss)) {
		console.log("\n--- consumer src/app.css (first 40 lines) ---");
		console.log(appCss.split("\n").slice(0, 40).join("\n"));
		console.log("--- end ---\n");
	}

	if (failures.length > 0) {
		throw new Error(`${failures.length} assertion(s) failed:\n  - ${failures.join("\n  - ")}`);
	}

	step("Build the consumer");
	await run("pnpm", ["build"], { cwd: consumerDir });

	step("Done");
	console.log("\nconsumer:smoke OK — theme installs from the registry and the consumer builds.\n");
}

process.on("SIGINT", async () => {
	await cleanup();
	process.exit(130);
});

try {
	await main();
	await cleanup();
	process.exit(0);
} catch (error) {
	console.error(`\nconsumer:smoke FAILED\n\n${error.message}\n`);
	await cleanup();
	process.exit(1);
}
