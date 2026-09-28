import { questions, type Question, type QuestionType } from "@/lib/questions";

export const QUESTION_TYPES: ReadonlyArray<{ value: QuestionType; label: string }> = [
  { value: "roadSignOrImageIdentification", label: "Road-sign / image identification" },
  { value: "numericalOrCalculation", label: "Numerical / calculation" },
  { value: "scenarioBased", label: "Scenario" },
  { value: "definitionOrKnowledge", label: "Definition / knowledge" },
  { value: "rulesOrProcedure", label: "Rules / procedure" },
];

export type TaxonomySubcategorySummary = {
  name: string;
  count: number;
};

export type TaxonomyCategorySummary = {
  name: string;
  count: number;
  subcategories: TaxonomySubcategorySummary[];
};

const categoryQuestions = new Map<string, Question[]>();
const subcategoryQuestions = new Map<string, Question[]>();
const typeQuestions = new Map<QuestionType, Question[]>();

for (const question of questions) {
  const { category, subcategory } = question.taxonomy;
  if (category && subcategory) {
    const categoryItems = categoryQuestions.get(category) ?? [];
    categoryItems.push(question);
    categoryQuestions.set(category, categoryItems);

    const subcategoryKey = `${category}\u0000${subcategory}`;
    const subcategoryItems = subcategoryQuestions.get(subcategoryKey) ?? [];
    subcategoryItems.push(question);
    subcategoryQuestions.set(subcategoryKey, subcategoryItems);
  }

  for (const type of question.questionTypes) {
    const typeItems = typeQuestions.get(type) ?? [];
    typeItems.push(question);
    typeQuestions.set(type, typeItems);
  }
}

export const taxonomyCategories: TaxonomyCategorySummary[] = [...categoryQuestions]
  .map(([name, categoryItems]) => ({
    name,
    count: categoryItems.length,
    subcategories: [...subcategoryQuestions]
      .filter(([key]) => key.startsWith(`${name}\u0000`))
      .map(([key, subcategoryItems]) => ({
        name: key.slice(name.length + 1),
        count: subcategoryItems.length,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en")),
  }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));

export function getQuestionsByCategory(category: string): Question[] {
  return categoryQuestions.get(category) ?? [];
}

export function getQuestionsBySubcategory(category: string, subcategory: string): Question[] {
  return subcategoryQuestions.get(`${category}\u0000${subcategory}`) ?? [];
}

export function getQuestionsByType(type: QuestionType): Question[] {
  return typeQuestions.get(type) ?? [];
}

export function getTaxonomyStats() {
  const categorizedCount = categoryQuestions.size > 0
    ? [...categoryQuestions.values()].reduce((total, items) => total + items.length, 0)
    : 0;
  return {
    total: questions.length,
    categorized: categorizedCount,
    unassigned: questions.length - categorizedCount,
    byCategory: taxonomyCategories,
    bySubcategory: taxonomyCategories.flatMap((category) => category.subcategories.map((subcategory) => ({
      category: category.name,
      subcategory: subcategory.name,
      count: subcategory.count,
    }))),
    byQuestionType: QUESTION_TYPES.map(({ value, label }) => ({
      type: value,
      label,
      count: typeQuestions.get(value)?.length ?? 0,
    })),
  };
}