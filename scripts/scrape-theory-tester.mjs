import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "http://theory-tester.com";
const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = `${OUTPUT_DIR}/questions.json`;
const DELAY_MS = 500;
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS || 805);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clean(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function stripTags(value) {
  return clean(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripTags(match[1]);
  }
  return null;
}

function extractQuestion(html, id) {
  const title = firstMatch(html, [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<h2[^>]*>([\s\S]*?)<\/h2>/i,
  ]);

  const category = firstMatch(html, [
    /(?:Category|category)[^<]{0,100}<[^>]*>([\s\S]*?)<\/[^>]+>/i,
  ]);

  const answerMatches = [...html.matchAll(
    /<(?:li|label|p|div)[^>]*>([\s\S]*?(?:answer|option)[\s\S]*?)<\/(?:li|label|p|div)>/gi
  )].map((match) => stripTags(match[1]));

  const uniqueAnswers = [...new Set(answerMatches.filter((answer) => answer.length > 1))];

  const imageMatch = html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/i);
  const image = imageMatch?.[1]
    ? new URL(imageMatch[1], BASE_URL).href
    : null;

  const explanation = firstMatch(html, [
    /(?:Explanation|explanation)[^<]*<[^>]*>([\s\S]*?)<\/[^>]+>/i,
  ]);

  return {
    id,
    question: title,
    answers: uniqueAnswers.slice(0, 4),
    correctAnswer: null,
    explanation,
    category,
    image,
    sourceUrl: `${BASE_URL}/questions/${id}`,
  };
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TheoryTester development scraper/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function main() {
  const ids = Array.from(
    { length: MAX_QUESTIONS },
    (_, index) => index + 1
  );

  console.log(`Checking ${ids.length} possible question URLs.`);

  const questions = [];

  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    process.stdout.write(`\rScraping ${index + 1}/${ids.length} — question ${id}   `);

    try {
      const html = await fetchPage(`${BASE_URL}/questions/${id}`);
      const question = extractQuestion(html, id);

      if (!question.question) {
        console.warn(`\nWarning: question ${id} did not produce a question title.`);
      }

      questions.push(question);
    } catch (error) {
      if (!String(error.message).includes("404")) {
        console.warn(`\nWarning: failed question ${id}: ${error.message}`);
      }
    }

    if (index < ids.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  questions.sort((a, b) => a.id - b.id);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        source: BASE_URL,
        scrapedAt: new Date().toISOString(),
        count: questions.length,
        questions,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`\n\nSaved ${questions.length} questions to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("\nScraper failed:", error.message);
  process.exit(1);
});
