#!/usr/bin/env node

/**
 * ISO Certification Consultant Codex Image Agent
 *
 * Generates hero / cluster images via the OpenAI Codex CLI under ChatGPT auth.
 * Codex's built-in `image_gen` tool runs server-side — no OPENAI_API_KEY required.
 *
 * Auth requirements:
 *   - `codex login` must be active (refresh token valid)
 *   - If you see "refresh token already used" errors: run `codex logout && codex login`
 *
 * Output:
 *   Codex writes the raw image to ~/.codex/generated_images/<thread>/ig_*.png,
 *   then copies + sips-resizes to the requested outputPath.
 *
 * Cost (verified 2026-04-26): ~42K tokens per image at default settings.
 *
 * Usage as a module:
 *   const { generateImage } = require('./codexImageAgent');
 *   const result = await generateImage({
 *     slug: 'iso-9001-toronto',
 *     scene: 'CNC machining shop floor in Toronto-area precision components plant ...',
 *     outputPath: '/abs/path/to/public/images/clusters/iso-9001-toronto.jpg',
 *     size: '1536x1024',  // 3:2, close to 16:9 — only valid Codex sizes
 *   });
 *   // -> { slug, path, success: true }
 *
 * Usage as a CLI (for testing):
 *   node codexImageAgent.js <slug> "<scene>" <outputPath>
 */

const { spawn } = require("node:child_process");
const { mkdirSync, existsSync, statSync } = require("node:fs");
const path = require("node:path");

const VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024"];
const DEFAULT_SIZE = "1536x1024";
const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes — image gen + copy can take a while

function buildPrompt({ scene, outputPath, size }) {
  return `Generate ONE photorealistic hero image, ${size} PNG.

Scene: ${scene}

Hard rules — these are non-negotiable:
- North American manufacturing or industrial setting only (no non-Western cities/factories/people)
- Photorealistic, commercial photography style, clean and modern
- No people unless the scene explicitly requests them
- No text, no logos, no watermarks, no signage in any language
- High dynamic range, sharp focus, well-lit
- ${size} aspect ratio

After generating, save the final image to ${outputPath}. If Codex's image_gen produces a different file location, copy it via cp and resize with sips so the final file is exactly at ${outputPath}.

After your attempt, print exactly ONE final line on stdout — nothing else after it:
- RESULT_PATH=${outputPath} on success
- ERROR=<short reason> on failure

Do not ask follow-up questions. Do not request approval. Proceed.`;
}

function generateImage({
  slug,
  scene,
  outputPath,
  size = DEFAULT_SIZE,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  if (!slug || !scene || !outputPath) {
    return Promise.reject(
      new Error(
        "codexImageAgent: { slug, scene, outputPath } are all required"
      )
    );
  }
  if (!VALID_SIZES.includes(size)) {
    return Promise.reject(
      new Error(
        `codexImageAgent: size "${size}" not supported. Valid: ${VALID_SIZES.join(", ")}`
      )
    );
  }

  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const prompt = buildPrompt({ scene, outputPath, size });
  const args = ["exec", "--full-auto", "--skip-git-repo-check", prompt];

  return new Promise((resolve, reject) => {
    const proc = spawn("codex", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 5000);
    }, timeoutMs);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `codexImageAgent: failed to spawn codex CLI — is it installed and on PATH? (${err.message})`
        )
      );
    });

    proc.on("close", (code) => {
      clearTimeout(timer);

      if (killed) {
        return reject(
          new Error(
            `codexImageAgent: timed out after ${Math.round(timeoutMs / 1000)}s for slug=${slug}`
          )
        );
      }

      const resultMatch = stdout.match(/RESULT_PATH=(\S+)/);
      const errorMatch = stdout.match(/ERROR=([^\n]+)/);

      if (resultMatch) {
        const finalPath = resultMatch[1].trim();
        if (existsSync(finalPath)) {
          const size = statSync(finalPath).size;
          return resolve({
            slug,
            path: finalPath,
            bytes: size,
            success: true,
          });
        }
        return reject(
          new Error(
            `codexImageAgent: codex reported success but file ${finalPath} does not exist`
          )
        );
      }

      if (errorMatch) {
        return reject(
          new Error(`codexImageAgent[${slug}]: ${errorMatch[1].trim()}`)
        );
      }

      reject(
        new Error(
          `codexImageAgent[${slug}]: codex exited with code ${code} and produced no RESULT_PATH or ERROR line.\nstdout tail: ${stdout.slice(-600)}\nstderr tail: ${stderr.slice(-400)}`
        )
      );
    });
  });
}

module.exports = { generateImage, VALID_SIZES, DEFAULT_SIZE };

// CLI entry: node codexImageAgent.js <slug> "<scene>" <output-path> [size]
if (require.main === module) {
  const [slug, scene, outputPath, size] = process.argv.slice(2);
  if (!slug || !scene || !outputPath) {
    console.error(
      'Usage: node codexImageAgent.js <slug> "<scene>" <output-path> [size]'
    );
    console.error(`  size defaults to ${DEFAULT_SIZE}; valid: ${VALID_SIZES.join(", ")}`);
    process.exit(1);
  }
  generateImage({ slug, scene, outputPath, size: size || DEFAULT_SIZE })
    .then((r) => {
      console.log(JSON.stringify(r));
      process.exit(0);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
