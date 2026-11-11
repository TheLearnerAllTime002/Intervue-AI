import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const templates = [
  ["frontend/.env.example", "frontend/.env"],
  ["backend/gateway/.env.example", "backend/gateway/.env"],
  ["backend/services/auth/.env.example", "backend/services/auth/.env"],
  ["backend/services/resume/.env.example", "backend/services/resume/.env"],
  ["backend/services/interview/.env.example", "backend/services/interview/.env"],
  ["backend/services/roadmap/.env.example", "backend/services/roadmap/.env"],
  ["backend/services/billing/.env.example", "backend/services/billing/.env"],
];

const missing = [];

for (const [template, target] of templates) {
  const templatePath = join(root, template);
  const targetPath = join(root, target);

  if (!existsSync(templatePath)) {
    missing.push(template);
    continue;
  }

  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(templatePath, targetPath);
    console.log(`Created ${target}`);
  } else {
    console.log(`Keeping existing ${target}`);
  }
}

if (missing.length > 0) {
  throw new Error(`Missing local environment templates: ${missing.join(", ")}`);
}

const requiredPlaceholders = [
  ["backend/services/auth/.env", "FIREBASE credentials"],
  ["backend/services/resume/.env", "GROQ_API_KEY"],
  ["backend/services/interview/.env", "GROQ_API_KEY"],
  ["backend/services/roadmap/.env", "GROQ_API_KEY"],
  ["backend/services/billing/.env", "RAZORPAY_KEY_SECRET"],
];

const incomplete = requiredPlaceholders.filter(([file, value]) => {
  const contents = readFileSync(join(root, file), "utf8");
  return contents.includes("your_") || contents.includes("replace_with_") || contents.includes("your-");
});

if (incomplete.length > 0) {
  console.warn("\nLocal environment files still contain placeholders:");
  for (const [file, value] of incomplete) {
    console.warn(`- ${relative(root, join(root, file))}: configure ${value}`);
  }
  console.warn("The services that need those credentials will report a clear startup error.\n");
}
