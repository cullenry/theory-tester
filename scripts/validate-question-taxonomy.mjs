import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src/data/questions.json");
const taxonomyPath = resolve(root, "reports/question-taxonomy.json");
const baselinePath = resolve(root, "reports/question-integrity-baseline.json");
const statsPath = resolve(root, "reports/question-taxonomy-implementation.md");
const originalFields = ["id", "question", "answers", "correctAnswer", "explanation", "category", "image", "sourceUrl"];
const questionTypeKeys = [
  "roadSignOrImageIdentification",
  "numericalOrCalculation",
  "scenarioBased",
  "definitionOrKnowledge",
  "rulesOrProcedure",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hashOriginalFields(question) {
  const projection = originalFields.map((field) => question[field]);
  return createHash("sha256").update(JSON.stringify(projection), "utf8").digest("hex");
}

function markdownEscape(value) {
  return String(value).replaceAll("|", "\\|");
}

function renderStats(dataset, taxonomy, categories, questionTypeCounts) {
  const rows = categories.map((category) => `| ${markdownEscape(category.category)} | ${category.count} |`);
  const subcategoryRows = categories.flatMap((category) => category.subcategories.map((subcategory) => `| ${markdownEscape(category.category)} | ${markdownEscape(subcategory.name)} | ${subcategory.count} |`));
  const typeRows = questionTypeKeys.map((key) => `| ${markdownEscape(key)} | ${questionTypeCounts.get(key) ?? 0} |`);
  return [
    "# Question Taxonomy Implementation Audit",
    "",
    `Source: \`${taxonomyPath.replace(`${root}\\`, "").replaceAll("\\", "/")}\`. Dataset: ${dataset.questions.length} questions. This is an implementation audit of the provisional content-derived taxonomy, not an official RSA/Prometric classification.`,
    "",
    `- Categorized: ${taxonomy.assignedCount}`,
    `- Uncategorized / uncertain: ${taxonomy.uncertainCount}`,
    `- Total: ${dataset.questions.length}`,
    "",
    "## Counts by Category",
    "",
    "| Category | Questions |",
    "| --- | ---: |",
    ...rows,
    "",
    "## Counts by Subcategory",
    "",
    "| Category | Subcategory | Questions |",
    "| --- | --- | ---: |",
    ...subcategoryRows,
    "",
    "## Counts by Question Type",
    "",
    "Question types overlap; these counts do not sum to the dataset total.",
    "",
    "| Question type | Questions |",
    "| --- | ---: |",
    ...typeRows,
    "",
  ].join("\n");
}

async function readDataset() {
  const dataset = JSON.parse(await readFile(sourcePath, "utf8"));
  assert(Array.isArray(dataset.questions), "Expected a questions array in src/data/questions.json.");
  return dataset;
}

async function captureBaseline(dataset) {
  const ids = dataset.questions.map((question) => question.id);
  assert(dataset.questions.length === 805, `Expected 805 source questions; found ${dataset.questions.length}.`);
  assert(new Set(ids).size === dataset.questions.length, "Cannot capture baseline: source IDs are not unique.");
  const records = [...dataset.questions].sort((a, b) => a.id - b.id).map((question) => ({ id: question.id, sha256: hashOriginalFields(question) }));
  const baseline = {
    source: "src/data/questions.json",
    capturedFields: originalFields,
    datasetMetadata: { source: dataset.source, scrapedAt: dataset.scrapedAt, count: dataset.count },
    questionCount: dataset.questions.length,
    uniqueIdCount: new Set(ids).size,
    records,
  };
  await mkdir(dirname(baselinePath), { recursive: true });
  await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`Captured original-field integrity hashes for ${records.length} questions in reports/question-integrity-baseline.json.`);
}

function validateOriginalFields(dataset, baseline) {
  assert(isDeepStrictEqual(baseline.capturedFields, originalFields), "Integrity baseline field list does not match the validator.");
  assert(isDeepStrictEqual(baseline.datasetMetadata, { source: dataset.source, scrapedAt: dataset.scrapedAt, count: dataset.count }), "Original dataset envelope metadata changed.");
  assert(dataset.questions.length === baseline.questionCount, `Question count changed: expected ${baseline.questionCount}, found ${dataset.questions.length}.`);
  const currentIds = dataset.questions.map((question) => question.id);
  assert(new Set(currentIds).size === currentIds.length, "Question IDs are not unique.");
  const expectedById = new Map(baseline.records.map((record) => [record.id, record.sha256]));
  assert(expectedById.size === baseline.uniqueIdCount, "Integrity baseline contains duplicate IDs.");
  for (const question of dataset.questions) {
    const expectedHash = expectedById.get(question.id);
    assert(expectedHash, `Question ID ${question.id} was not present in the integrity baseline.`);
    assert(hashOriginalFields(question) === expectedHash, `An original scraped field changed for question ID ${question.id}.`);
  }
}

function collectAssignments(taxonomy) {
  const assigned = new Map();
  const expectedCategoryCounts = new Map();
  const expectedSubcategoryCounts = new Map();
  for (const category of taxonomy.categories) {
    const categoryIds = new Set();
    let categoryTotal = 0;
    for (const subcategory of category.subcategories) {
      const ids = new Set(subcategory.questionIds);
      assert(ids.size === subcategory.questionIds.length, `Duplicate IDs within ${category.category} → ${subcategory.name}.`);
      expectedSubcategoryCounts.set(`${category.category}\u0000${subcategory.name}`, subcategory.count);
      assert(subcategory.questionIds.length === subcategory.count, `Subcategory count mismatch for ${category.category} → ${subcategory.name}.`);
      for (const id of ids) {
        assert(!assigned.has(id), `Question ID ${id} is assigned more than once in the taxonomy.`);
        assigned.set(id, { category: category.category, subcategory: subcategory.name });
        categoryIds.add(id);
        categoryTotal += 1;
      }
    }
    assert(categoryTotal === category.count, `Category count mismatch for ${category.category}.`);
    expectedCategoryCounts.set(category.category, category.count);
  }
  return { assigned, expectedCategoryCounts, expectedSubcategoryCounts };
}

function validateTaxonomy(dataset, taxonomy) {
  const questions = dataset.questions;
  assert(questions.length === taxonomy.datasetCount, `Taxonomy dataset count ${taxonomy.datasetCount} does not match source count ${questions.length}.`);
  assert(taxonomy.assignedCount === 619, `Expected 619 assigned questions from the analyzed taxonomy; found ${taxonomy.assignedCount}.`);
  assert(taxonomy.uncertainCount === 186, `Expected 186 uncertain questions from the analyzed taxonomy; found ${taxonomy.uncertainCount}.`);

  const { assigned, expectedCategoryCounts, expectedSubcategoryCounts } = collectAssignments(taxonomy);
  const uncertain = new Map(taxonomy.uncertain.map((item) => [item.id, item]));
  assert(uncertain.size === taxonomy.uncertain.length, "Duplicate IDs in the uncertain list.");
  for (const id of uncertain.keys()) assert(!assigned.has(id), `Question ID ${id} is both assigned and uncertain.`);
  assert(assigned.size === taxonomy.assignedCount, "Assigned ID count does not match the taxonomy summary.");
  assert(uncertain.size === taxonomy.uncertainCount, "Uncertain ID count does not match the taxonomy summary.");
  assert(assigned.size + uncertain.size === questions.length, "Assigned and uncertain IDs do not partition the dataset.");

  const typeMap = taxonomy.questionTypesById;
  const definedTypeKeys = new Set(taxonomy.questionTypeAnalysis.map((item) => item.key));
  assert(questionTypeKeys.every((key) => definedTypeKeys.has(key)), "A required question-type signal is missing from the analysis.");
  assert(Object.keys(typeMap).length === questions.length, "Question-type metadata does not cover all question IDs.");
  const actualCategoryCounts = new Map();
  const actualSubcategoryCounts = new Map();
  const actualTypeCounts = new Map(questionTypeKeys.map((key) => [key, 0]));
  const knownIds = new Set(questions.map((question) => question.id));

  for (const question of questions) {
    const assignment = assigned.get(question.id);
    const uncertainRecord = uncertain.get(question.id);
    assert(Boolean(assignment) !== Boolean(uncertainRecord), `Question ID ${question.id} must be either assigned or uncertain exactly once.`);
    assert(question.taxonomy && typeof question.taxonomy === "object", `Question ID ${question.id} is missing taxonomy metadata.`);
    assert(Array.isArray(question.questionTypes), `Question ID ${question.id} is missing questionTypes metadata.`);
    const expectedTypes = typeMap[String(question.id)];
    assert(Array.isArray(expectedTypes), `Question ID ${question.id} has no analyzed question-type entry.`);
    assert(new Set(expectedTypes).size === expectedTypes.length, `Duplicate question-type values for ID ${question.id}.`);
    for (const type of expectedTypes) {
      assert(definedTypeKeys.has(type), `Unknown question type '${type}' for ID ${question.id}.`);
      actualTypeCounts.set(type, actualTypeCounts.get(type) + 1);
    }
    assert(isDeepStrictEqual(question.questionTypes, expectedTypes), `Question-type metadata differs from the analysis for ID ${question.id}.`);

    if (assignment) {
      assert(question.taxonomy.category === assignment.category, `Wrong taxonomy category for ID ${question.id}.`);
      assert(question.taxonomy.subcategory === assignment.subcategory, `Wrong taxonomy subcategory for ID ${question.id}.`);
      assert(question.taxonomy.confidence === "high", `Assigned question ${question.id} must have high confidence.`);
      actualCategoryCounts.set(assignment.category, (actualCategoryCounts.get(assignment.category) ?? 0) + 1);
      const key = `${assignment.category}\u0000${assignment.subcategory}`;
      actualSubcategoryCounts.set(key, (actualSubcategoryCounts.get(key) ?? 0) + 1);
    } else {
      assert(question.taxonomy.category === null && question.taxonomy.subcategory === null, `Uncertain question ${question.id} must remain unassigned.`);
      assert(question.taxonomy.confidence === "uncertain", `Uncertain question ${question.id} must retain uncertain confidence.`);
      const expectedCandidates = uncertainRecord.candidatePaths.map(({ category, subcategory, score }) => ({ category, subcategory, score }));
      assert(isDeepStrictEqual(question.taxonomy.candidates, expectedCandidates), `Candidate paths differ from the analysis for uncertain ID ${question.id}.`);
    }
  }

  for (const [category, expectedCount] of expectedCategoryCounts) {
    assert((actualCategoryCounts.get(category) ?? 0) === expectedCount, `Implemented category count mismatch for ${category}.`);
  }
  for (const [key, expectedCount] of expectedSubcategoryCounts) {
    assert((actualSubcategoryCounts.get(key) ?? 0) === expectedCount, `Implemented subcategory count mismatch for ${key.replace("\u0000", " → ")}.`);
  }
  for (const analysis of taxonomy.questionTypeAnalysis) {
    assert((actualTypeCounts.get(analysis.key) ?? 0) === analysis.count, `Question-type count mismatch for ${analysis.key}.`);
    for (const id of analysis.questionIds) assert(knownIds.has(id), `Question type ${analysis.key} references unknown ID ${id}.`);
  }

  return { categorizedCount: assigned.size, uncertainCount: uncertain.size, actualCategoryCounts, actualSubcategoryCounts, actualTypeCounts };
}

async function main() {
  const dataset = await readDataset();
  if (process.argv.includes("--capture-baseline")) {
    await captureBaseline(dataset);
    return;
  }

  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
  validateOriginalFields(dataset, baseline);
  const results = validateTaxonomy(dataset, taxonomy);
  const statsMarkdown = renderStats(dataset, taxonomy, taxonomy.categories, results.actualTypeCounts);
  await writeFile(statsPath, statsMarkdown, "utf8");

  console.log(`Validated ${dataset.questions.length} questions; ${results.categorizedCount} categorized, ${results.uncertainCount} uncertain.`);
  console.log("Original question text, answers, answer keys, explanations, category, images, IDs and source URLs match the integrity baseline.");
  console.log("Taxonomy and question-type counts match reports/question-taxonomy.json.");
  console.log(`Implementation statistics written to ${statsPath}.`);
}

await main();