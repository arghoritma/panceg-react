import { createMigration } from "../src/db/migrations";

const name = process.argv[2];
const moreArgs = process.argv.length;

if (!name) {
  console.error("Usage: bun run db:make <lowercase_snake_case_name>");
  process.exit(1);
}

if (moreArgs > 3) {
  console.error("Use camel_case_name as argument");
  process.exit(1);
}

try {
  console.log(`Created ${createMigration(name)}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
