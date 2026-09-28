import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src/data/questions.json");
const taxonomyPath = resolve(root, "reports/question-taxonomy.json");
const baselinePath = resolve(root, "reports/question-integrity-baseline.json");
const originalFields = ["id", "question", "answers", "correctAnswer", "explanation", "category", "image", "sourceUrl"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hashOriginalFields(question) {
  return createHash("sha256").update(JSON.stringify(originalFields.map((field) => question[field])), "utf8").digest("hex");
}

function validateBaseline(dataset, baseline) {
  assert(isDeepStrictEqual(baseline.capturedFields, originalFields), "Integrity baseline fields do not match the migrator.");
  assert(isDeepStrictEqual(baseline.datasetMetadata, { source: dataset.source, scrapedAt: dataset.scrapedAt, count: dataset.count }), "Dataset envelope differs from the captured baseline.");
  assert(dataset.questions.length === baseline.questionCount, "Dataset question count differs from the captured baseline.");
  const originalById = new Map(baseline.records.map((record) => [record.id, record.sha256]));
  assert(originalById.size === dataset.questions.length, "Baseline record count is invalid.");
  for (const question of dataset.questions) {
    assert(originalById.get(question.id) === hashOriginalFields(question), `Original source fields differ from baseline for ID ${question.id}.`);
  }
}

function createAssignments(taxonomy, dataset) {
  const assignments = new Map();
  const uncertain = new Map();

  for (const category of taxonomy.categories) {
    for (const subcategory of category.subcategories) {
      for (const id of subcategory.questionIds) {
        assert(!assignments.has(id), `Duplicate category assignment for ID ${id}.`);
        assignments.set(id, { category: category.category, subcategory: subcategory.name });
      }
    }
  }
  for (const item of taxonomy.uncertain) {
    assert(!uncertain.has(item.id) && !assignments.has(item.id), `Duplicate or conflicting uncertain ID ${item.id}.`);
    uncertain.set(item.id, item);
  }

  const ids = dataset.questions.map((question) => question.id);
  assert(ids.length === 805 && new Set(ids).size === ids.length, "Expected exactly 805 questions with unique IDs.");
  assert(assignments.size === taxonomy.assignedCount, "Assigned ID count differs from taxonomy summary.");
  assert(uncertain.size === taxonomy.uncertainCount, "Uncertain ID count differs from taxonomy summary.");
  assert(assignments.size + uncertain.size === ids.length, "Taxonomy and uncertain IDs do not partition the dataset.");
  for (const id of ids) assert(assignments.has(id) || uncertain.has(id), `ID ${id} is not represented in the taxonomy analysis.`);
  for (const id of [...assignments.keys(), ...uncertain.keys()]) assert(ids.includes(id), `Taxonomy references unknown source ID ${id}.`);

  return { assignments, uncertain };
}

async function main() {
  const dataset = JSON.parse(await readFile(sourcePath, "utf8"));
  const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  assert(Array.isArray(dataset.questions), "Expected a questions array in the source data.");
  validateBaseline(dataset, baseline);

  const { assignments, uncertain } = createAssignments(taxonomy, dataset);
  const questionTypesById = taxonomy.questionTypesById;
  const validTypes = new Set(taxonomy.questionTypeAnalysis.map((item) => item.key));

  for (const question of dataset.questions) {
    const questionTypes = questionTypesById[String(question.id)];
    assert(Array.isArray(questionTypes), `No question-type metadata for ID ${question.id}.`);
    assert(questionTypes.every((type) => validTypes.has(type)), `Unknown question-type value for ID ${question.id}.`);
    const assignment = assignments.get(question.id);
    if (assignment) {
      question.taxonomy = { ...assignment, confidence: "high", candidates: [] };
    } else {
      const candidatePaths = uncertain.get(question.id).candidatePaths.map(({ category, subcategory, score }) => ({ category, subcategory, score }));
      question.taxonomy = { category: null, subcategory: null, confidence: "uncertain", candidates: candidatePaths };
    }
    question.questionTypes = [...questionTypes];
  }

  const output = `${JSON.stringify(dataset, null, 2)}\n`;
  if (process.argv.includes("--dry-run")) {
    console.log(`Dry run passed: ${assignments.size} assigned, ${uncertain.size} uncertain; original fields match baseline.`);
    console.log(`Would write ${Buffer.byteLength(output, "utf8")} bytes to src/data/questions.json.`);
    return;
  }

  assert(process.argv.includes("--apply"), "Use --dry-run to inspect the migration or --apply to update questions.json.");
  await writeFile(sourcePath, output, "utf8");
  console.log(`Added taxonomy and question-type metadata to ${dataset.questions.length} questions.`);
}

await main();