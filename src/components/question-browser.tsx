"use client";

import Link from "next/link";
import { useState } from "react";
import { questions } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";

export function QuestionBrowser() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const selectedCategory = taxonomyCategories.find((item) => item.name === category);
  const term = search.trim().toLocaleLowerCase();
  const filtered = questions.filter((question) =>
    (category === "all" || question.taxonomy.category === category)
    && (subcategory === "all" || question.taxonomy.subcategory === subcategory)
    && (!term || question.question.toLocaleLowerCase().includes(term)));

  return <>
    <div className="browser-controls">
      <label className="search-label">Search questions<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “right of way”" /></label>
      <label className="category-label">Category<select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory("all"); }}><option value="all">All categories ({questions.length})</option>{taxonomyCategories.map((item) => <option value={item.name} key={item.name}>{item.name} ({item.count})</option>)}</select></label>
      <label className="category-label">Subcategory<select value={subcategory} disabled={!selectedCategory} onChange={(event) => setSubcategory(event.target.value)}><option value="all">All subcategories{selectedCategory ? ` (${selectedCategory.count})` : ""}</option>{selectedCategory?.subcategories.map((item) => <option value={item.name} key={item.name}>{item.name} ({item.count})</option>)}</select></label>
    </div>
    <p className="result-count" aria-live="polite">Showing {filtered.length} of {questions.length} questions</p>
    {filtered.length ? <div className="question-list">{filtered.map((question) => <Link className="question-list-row" href={`/questions/${question.id}`} key={question.id}><span className="question-list-id">#{question.id}</span><span className="question-list-copy"><strong>{question.question}</strong><small>{question.taxonomy.category ? `${question.taxonomy.category} · ${question.taxonomy.subcategory}` : "Uncategorized"} · {question.answers.length} answer options</small></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div> : <div className="empty-state"><h2>No questions found</h2><p>Try another search or choose a different category.</p></div>}
  </>;
}