import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src/data/questions.json");
const reportPath = resolve(root, "reports/question-analysis.md");
const taxonomyPath = resolve(root, "reports/question-taxonomy.json");

const fieldWeights = [
  ["question", 6],
  ["answers", 1],
  ["correctAnswer", 1.25],
  ["explanation", 0.3],
];

const taxonomyRules = [
  {
    category: "Signs, signals and road markings",
    subcategories: [
      { name: "Traffic signs", signals: [/\b(?:road|traffic|warning|regulatory|information|direction|priority|prohibition) signs?\b/i, /\bwhat (?:does this sign|do these signs?) .* mean\b/i, /\bsign(?:s)? (?:mean|indicate|displayed|accompanied)\b/i] },
      { name: "Traffic lights and crossing signals", signals: [/\btraffic lights?\b/i, /\btraffic signals?\b/i, /\bpedestrian lights?\b/i, /\b(?:zebra|pelican|toucan) crossing\b/i, /\bflashing amber (?:light|arrow|beacon)s?\b/i] },
      { name: "Road markings and lane-control markings", signals: [/\broad markings?\b/i, /\b(?:white|yellow|broken|continuous) line\b/i, /\b(?:cycle|bus) lane\b/i, /\b(?:lane arrows?|directional arrows?)\b/i, /\b(?:clearway|stop line)\b/i] },
      { name: "Hand and Garda signals", signals: [/\bhand signals?\b/i, /\bGarda signals?\b/i, /\bpolice (?:officer )?signals?\b/i] },
    ],
  },
  {
    category: "Road positioning and manoeuvres",
    subcategories: [
      { name: "Junctions, turning and roundabouts", signals: [/\bjunctions?\b/i, /\broundabouts?\b/i, /\b(?:turn|turning|turns) (?:left|right|around|at)\b/i, /\b(?:left|right)[- ]hand turn\b/i, /\bU[- ]turn\b/i, /\b(?:give way|right of way|priority)\b/i, /\bcrossroads?\b/i] },
      { name: "Overtaking and passing", signals: [/\bovertak(?:e|es|ing|en)\b/i, /\bbeing overtaken\b/i, /\bpass(?:ing)? (?:another|a|the) vehicle\b/i, /\bundertak(?:e|ing)\b/i] },
      { name: "Lane choice, merging and special roads", signals: [/\b(?:motorway|dual carriageway|slip road|auxiliary lane|hard shoulder|2[- ]plus[- ]1|one-way street)\b/i, /\b(?:change|move|join|merge) (?:into|to) (?:the )?(?:left|right|another) lane\b/i, /\bwhich lane\b/i, /\bmiddle lane\b/i, /\broad position\b/i, /\bmiss(?:es|ed)? (?:the |an? )?exit\b/i, /\bbus lane\b/i, /\bcycle lane\b/i] },
      { name: "Parking, stopping and reversing", signals: [/\bpark(?:ing|ed)?\b/i, /\brevers(?:e|ing|ed)\b/i, /\bparking space\b/i, /\bdouble park\b/i, /\b(?:stop|stopping) temporarily\b/i, /\bturn (?:a vehicle )?around\b/i] },
      { name: "Railway crossings", signals: [/\b(?:railway|rail|train) level crossing\b/i, /\blevel crossing\b/i, /\brailway crossing\b/i] },
      { name: "Signalling intentions", signals: [/\b(?:give|giving|late) signals?\b/i, /\bindicators?\b/i, /\bsignal (?:clearly|properly|in good time)\b/i] },
    ],
  },
  {
    category: "Vehicle control, speed and stability",
    subcategories: [
      { name: "Braking and stopping distance", signals: [/\bbrak(?:e|es|ed|ing)\b/i, /\bstopping distance\b/i, /\bemergency stop\b/i, /\bslow(?:ing)? down and stop\b/i] },
      { name: "Speed and following distance", signals: [/\bspeed limits?\b/i, /\b(?:safe|appropriate|excessive|high) speed\b/i, /\b(?:following|stopping|passing) distance\b/i, /\btailgat(?:e|ing)\b/i, /\bdistance (?:from|to) the vehicle in front\b/i, /\bkm\/?h\b/i] },
      { name: "Skids, aquaplaning and stability", signals: [/\bskid(?:s|ding)?\b/i, /\baquaplan(?:e|ing)\b/i, /\belectronic stability control\b/i, /\banti[- ]lock braking system\b/i, /\bABS\b/i, /\bjack[- ]knif(?:e|ing)\b/i, /\broad holding\b/i, /\b(?:overturn|overturning|roll[- ]over|vehicle stability)\b/i] },
      { name: "Steering, gears and driver controls", signals: [/\bsteering wheel\b/i, /\bsteering\b/i, /\baccelerator\b/i, /\bclutch\b/i, /\bhandbrake\b/i, /\bparking brake\b/i, /\b(?:gear|gears|gearbox|transmission)\b/i, /\bdriver'?s seat\b/i, /\bleft foot\b/i, /\bfoot ?rest\b/i, /\bcockpit drill\b/i, /\bpower take[- ]off\b/i] },
    ],
  },
  {
    category: "Road conditions, visibility and hazard awareness",
    subcategories: [
      { name: "Weather and road-surface conditions", signals: [/\b(?:rain|rainy|wet road|snow|snowy|ice|icy|black ice|fog|frost|flood(?:ed|ing)?|wind|slippery|aquaplan)\b/i, /\bweather conditions?\b/i, /\broad surface\b/i, /\bpoor weather\b/i] },
      { name: "Visibility, darkness and glare", signals: [/\b(?:at night|dark(?:ness)?|unlit|poorly-lit|poorly lit|visibility|dazzl(?:e|ed|ing)|glare|sunlight|headlights?|dipped lights?|main beam|fog lights?)\b/i, /\bsee (?:for|ahead|clearly)\b/i] },
      { name: "Road hazards, obstructions and roadworks", signals: [/\b(?:hazard|roadworks?|road works|obstruction|oil spill|spilt diesel|loose chippings|pothol(?:e|ed)|debris|machinery|rumble strips?|mud on the road|traffic calming)\b/i, /\bblocked (?:view|vision)\b/i, /\bview is blocked\b/i, /\b(?:railway|rail|train) level crossing\b/i] },
      { name: "Hills, bends and narrow roads", signals: [/\b(?:hill|hills|brow|humpbacked|steep descent|bend|corner|restricted view|narrow road|narrow gap|sharp dip|uneven road)\b/i] },
    ],
  },
  {
    category: "Vulnerable road users and sharing the road",
    subcategories: [
      { name: "Pedestrians and pedestrian crossings", signals: [/\bpedestrian(?:s)?\b/i, /\b(?:children playing|children on (?:a )?bicycles?|children at the edge of the road|school children)\b/i, /\bpeople crossing\b/i, /\b(?:zebra|pelican|toucan|pedestrian) crossing\b/i, /\bfootpath\b/i, /\bwalking along\b/i, /\bopening (?:the )?(?:vehicle )?doors?\b/i, /\bpassengers? (?:get|getting) out\b/i] },
      { name: "Cyclists, motorcyclists and e-scooters", signals: [/\bcycl(?:e|ist|ists|ing)\b/i, /\bbicycl(?:e|es|ist|ists)\b/i, /\bmotorcycl(?:e|ist|ists)\b/i, /\be[- ]scooter(?:s)?\b/i, /\bmicromobility\b/i] },
      { name: "Horses, livestock and other animals", signals: [/\b(?:horse|horses|rider|riders|cattle|livestock|animals?)\b/i, /\bdog(?:s)? on the road\b/i] },
    ],
  },
  {
    category: "Vehicle condition, equipment and maintenance",
    subcategories: [
      { name: "Tyres and wheels", signals: [/\btyres?\b/i, /\btires?\b/i, /\bwheel(?:s)?\b/i, /\bpuncture\b/i, /\bblow[- ]out\b/i, /\btread depth\b/i] },
      { name: "Brakes, steering and suspension systems", signals: [/\bbrak(?:e|es|ing) (?:system|pedal|fluid|lining|pad|failure)\b/i, /\bbrake fluid\b/i, /\bshock absorbers?\b/i, /\bpower steering\b/i, /\bsuspension\b/i] },
      { name: "Engine, fuel, fluids and battery", signals: [/\bengine\b/i, /\b(?:engine )?oil\b/i, /\bfuel (?:system|gauge|level|leak|smell)\b/i, /\bsmell of fuel\b/i, /\b(?:flat|weak) battery\b/i, /\bbattery\b/i, /\bcoolant\b/i, /\boil pressure\b/i, /\bexhaust\b/i, /\bcatalytic converter\b/i] },
      { name: "Lights, mirrors, windows and instruments", signals: [/\b(?:warning lights?|dashboard|indicators?|headlights?|tail lights?|brake lights?|mirrors?|windscreens?|windshields?|wipers?|windows?|temperature gauge|rev counter|speedometer|fuel gauge|condensation)\b/i, /\bvehicle'?s lights?\b/i, /\bvehicle lighting\b/i] },
      { name: "Towing, trailers and loads", signals: [/\b(?:tow(?:ing|ed)?|trailer|caravan|load|overload(?:ed|ing)?|load index|gross vehicle weight|maximum authorised mass|MAM|jack-knif|unhitch(?:ing)?|hitch(?:ing)?)\b/i, /\btractor and trailer\b/i] },
      { name: "Vehicle checks, legal condition and servicing", signals: [/\b(?:maintain|maintenance|servic(?:e|ed|ing)|weekly check|vehicle condition|roadworthy|rust|vehicle inspection|keep in good condition|check(?:ed|ing)? .* lights?)\b/i] },
      { name: "Occupant protection and restraints", signals: [/\b(?:seat ?belts?|safety belts?|child restraint|child seat|head restraint|airbag|passenger safety|passengers? wear)\b/i] },
    ],
  },
  {
    category: "Driver fitness and responsible conduct",
    subcategories: [
      { name: "Fatigue, alertness and emotional state", signals: [/\b(?:tired|fatigu(?:e|ed)|drowsy|micro[- ]sleep|stay alert|keep alert|remain alert|long journey|upset|angry|stress(?:ed)?)\b/i] },
      { name: "Alcohol, drugs and impairing medication", signals: [/\b(?:alcohol|drink driving|drunk|blood alcohol|BAC|drug driving|drugs|medication|medicine|impair(?:ed|ment))\b/i] },
      { name: "Distraction and mobile-phone use", signals: [/\bmobile phones?\b/i, /\bhand[- ]held phone\b/i, /\bdistraction\b/i, /\buse (?:a|the) phone\b/i] },
      { name: "Courtesy, judgement and safe conduct", signals: [/\b(?:aggressive driving|aggressive|courtesy|courteous|rubbernecking|in a hurry|behind schedule|learner driver.*(?:react|unusual)|behaviour)\b/i] },
    ],
  },
  {
    category: "Licensing, road law and driver responsibilities",
    subcategories: [
      { name: "Learner permits, licences and supervision", signals: [/\b(?:learner permit|learner driver|learner drivers|L plates?|Category [A-Z]|full licence|driving test|certificate of competency|accompanying driver|unaccompanied|licen[cs]ed? to drive)\b/i, /\bpassed (?:their|the) (?:driving )?test using (?:a|an) automatic\b/i] },
      { name: "Insurance, tax and vehicle documentation", signals: [/\b(?:insurance|insured|tax disc|vehicle tax|registration|number plate|public road without a current tax)\b/i] },
      { name: "Offences, penalties and legal limits", signals: [/\b(?:penalt(?:y|ies)|fine|disqualif(?:ied|ication)|penalty points?|offence|conviction|legal(?:ly)?|permitted|prohibited|allowed|maximum|minimum|must a driver|is it an offence|exempt from|exception to)\b/i, /\b(?:speed|alcohol|drug|seat belt|parking) limit\b/i] },
    ],
  },
  {
    category: "Emergencies, collisions and first aid",
    subcategories: [
      { name: "Breakdowns, fires and roadside incidents", signals: [/\b(?:break(?:s|down|down|ing)|broken down|vehicle failure|engine cuts out|fire|puncture on a motorway|stalled.*crossing|emergency telephone)\b/i, /\bwhat should a driver do if .*break\b/i] },
      { name: "Collisions, casualties and first aid", signals: [/\b(?:crash|collision|accident|incident|property damage|injur(?:ed|y)|casualt(?:y|ies)|first aid|burn(?:ed|s)?|emergency services|telephone number.*crash)\b/i] },
      { name: "Emergency vehicles and responding to them", signals: [/\b(?:emergency vehicles?|emergency service vehicles?|ambulance|flashing blue lights?|sirens?|Garda vehicle)\b/i] },
    ],
  },
  {
    category: "Efficient and environmentally responsible driving",
    subcategories: [
      { name: "Fuel-efficient and eco-driving techniques", signals: [/\b(?:eco[- ]driving|fuel efficiency|fuel consumption|fuel efficient|save fuel|fuel economy|minimi[sz](?:e|ing) fuel)\b/i] },
      { name: "Emissions and environmental impact", signals: [/\b(?:environment|environmental|pollution|emissions?|exhaust pollution|harm the environment|protect the environment)\b/i] },
    ],
  },
];

const topicTypeRules = [
  {
    key: "roadSignOrImageIdentification",
    label: "Road-sign / image identification",
    description: "An image is present and the wording points to a sign, signal, marking, hand signal, gauge or similar item to identify.",
    test: (question) => Boolean(question.image) && /\b(?:sign|signals?|traffic light|road markings?|hand signal|Garda signal|marking|dial|rev counter|gauge|warning light)\b/i.test(question.question),
  },
  {
    key: "numericalOrCalculation",
    label: "Numerical or calculation-oriented",
    description: "The question wording asks for a measurable quantity, limit, count, duration, distance, speed, weight or BAC value.",
    test: (question) => /\b(?:how many|how much|how far|how long|what distance|what (?:is|are) the (?:maximum|minimum)|calculate|calculation|number of|period of|for how many|for how long|km\/?h|kph|metres?|meters?|kilometres?|kilograms?|tonnes?|months?|years?|mg|BAC|%)\b|\d/i.test(question.question),
  },
  {
    key: "scenarioBased",
    label: "Scenario-based",
    description: "A conditional, situated or action-in-context prompt; image-led situational prompts are included.",
    test: (question) => /\b(?:in this situation|as the driver|when (?:approaching|driving|travelling|turning|overtaking|stopped|faced|using)|while driving|if (?:a|the|their|you)|there (?:is|are)|ahead|on approach to|what should .* do)\b/i.test(question.question) || Boolean(question.image && !/\b(?:what does (?:this|these) sign|what does this traffic light|what does this road marking|what does this hand signal)\b/i.test(question.question)),
  },
  {
    key: "definitionOrKnowledge",
    label: "Definition / knowledge",
    description: "A term, purpose, meaning, effect, cause or factual property is requested.",
    test: (question) => /^(?:what (?:is|are|does|do|can|may)|which (?:of|type|vehicle|road)|who (?:is|can|should)|why |how does|how can|in what way)/i.test(question.question.trim()) || /\b(?:what is the purpose|what does .* mean|what effect|what can cause|what does .* indicate|what is meant by)\b/i.test(question.question),
  },
  {
    key: "rulesOrProcedure",
    label: "Rules / procedure",
    description: "A permitted action, obligation, safe response, sequence or required procedure is requested.",
    test: (question) => /\b(?:should|must|allowed|permitted|prohibited|when may|when can|what action|what procedure|what should|what must|how should|where should|is it legal|is .* allowed)\b/i.test(question.question),
  },
];

function normalizeText(value) {
  return String(value ?? "").replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function roundPercentage(value, total) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function getQuestionText(question) {
  return [question.question, ...question.answers, question.correctAnswer, question.explanation]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

function scoreSubcategory(question, subcategory) {
  const fieldValues = {
    question: normalizeText(question.question),
    answers: normalizeText(question.answers.join(" ")),
    correctAnswer: normalizeText(question.correctAnswer),
    explanation: normalizeText(question.explanation),
  };
  return subcategory.signals.reduce((score, pattern) => {
    return score + fieldWeights.reduce((fieldScore, [fieldName, weight]) => {
      return fieldScore + (pattern.test(fieldValues[fieldName]) ? weight : 0);
    }, 0);
  }, 0);
}

function analyzeTopics(question) {
  const scored = taxonomyRules.flatMap((rule) => rule.subcategories.map((subcategory) => ({
    category: rule.category,
    subcategory: subcategory.name,
    score: scoreSubcategory(question, subcategory),
  }))).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.category.localeCompare(b.category, "en") || a.subcategory.localeCompare(b.subcategory, "en"));

  const categoryScores = new Map();
  for (const item of scored) {
    categoryScores.set(item.category, Math.max(categoryScores.get(item.category) ?? 0, item.score));
  }
  const rankedCategories = [...categoryScores].map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category, "en"));
  const top = rankedCategories[0];
  const second = rankedCategories[1];
  const topSubcategory = top ? scored.find((item) => item.category === top.category) : undefined;
  const genericImagePrompt = Boolean(question.image) && /\b(?:in this situation|what should (?:a |the )?driver do|what action should|what should (?:a |the )?driver be aware|what must a driver be prepared)\b/i.test(question.question);
  const closeCategoryTie = Boolean(top && second && second.score >= 2.5 && top.score - second.score <= Math.max(1.1, top.score * 0.22));
  const weakEvidence = !top || top.score < 2.6;
  const imageNeedsContext = genericImagePrompt && (!top || top.score < 4.5);
  const uncertain = closeCategoryTie || weakEvidence || imageNeedsContext;
  const reasons = [];
  if (closeCategoryTie) reasons.push("Several topic families have similarly strong text evidence.");
  if (weakEvidence) reasons.push("The text fields do not establish a sufficiently specific topic.");
  if (imageNeedsContext) reasons.push("The prompt depends on an image scenario whose subject is not recoverable from the wording and text fields alone.");

  const candidateThreshold = top ? Math.max(2.2, top.score * 0.68) : Number.POSITIVE_INFINITY;
  const candidatePaths = rankedCategories.filter((item) => item.score >= candidateThreshold)
    .slice(0, 5)
    .map(({ category }) => scored.find((item) => item.category === category))
    .filter(Boolean)
    .map(({ category, subcategory, score }) => ({ category, subcategory, score: Math.round(score * 100) / 100 }));

  return {
    assignment: uncertain || !topSubcategory ? null : { category: topSubcategory.category, subcategory: topSubcategory.subcategory },
    uncertain: uncertain || !topSubcategory,
    uncertaintyReasons: reasons.length ? reasons : (!topSubcategory ? ["No taxonomy rule matched strongly enough."] : []),
    candidatePaths,
    scores: rankedCategories.map(({ category, score }) => ({ category, score: Math.round(score * 100) / 100 })),
  };
}

function classifyQuestionType(question) {
  const allText = getQuestionText(question);
  return topicTypeRules.filter((rule) => rule.test(question, allText)).map(({ key }) => key);
}

function exampleRecords(records, count = 3) {
  return [...records].sort((a, b) => a.id - b.id).slice(0, count).map((question) => ({
    id: question.id,
    question: question.question,
  }));
}

function groupedSummary(records, total, includeSubcategories = false) {
  const grouped = new Map();
  for (const record of records) {
    const key = record.assignment.category;
    const group = grouped.get(key) ?? { category: key, records: [], subcategories: new Map() };
    group.records.push(record.question);
    const subcategory = group.subcategories.get(record.assignment.subcategory) ?? [];
    subcategory.push(record.question);
    group.subcategories.set(record.assignment.subcategory, subcategory);
    grouped.set(key, group);
  }

  return [...grouped.values()].map((group) => ({
    category: group.category,
    count: group.records.length,
    percentage: roundPercentage(group.records.length, total),
    questionIds: group.records.map((question) => question.id).sort((a, b) => a - b),
    examples: exampleRecords(group.records),
    ...(includeSubcategories ? {
      subcategories: [...group.subcategories].map(([name, subcategoryRecords]) => ({
        name,
        count: subcategoryRecords.length,
        percentage: roundPercentage(subcategoryRecords.length, total),
        questionIds: subcategoryRecords.map((question) => question.id).sort((a, b) => a - b),
        examples: exampleRecords(subcategoryRecords),
      })).sort((a, b) => a.name.localeCompare(b.name, "en")),
    } : {}),
  })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "en"));
}

function categoryLabel(question) {
  return normalizeText(question.category) || "(missing)";
}

function buildAnalysis(questions, envelope) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const analyses = questions.map((question) => ({
    question,
    topic: analyzeTopics(question),
    questionTypes: classifyQuestionType(question),
  }));
  const assigned = analyses.filter((item) => item.topic.assignment);
  const uncertain = analyses.filter((item) => item.topic.uncertain);
  const taxonomy = groupedSummary(assigned.map((item) => ({ question: item.question, assignment: item.topic.assignment })), questions.length, true);
  const countsByOldCategory = new Map();

  for (const item of analyses) {
    const key = categoryLabel(item.question);
    const group = countsByOldCategory.get(key) ?? { category: key, records: [], assignedTopics: new Map() };
    group.records.push(item.question);
    if (item.topic.assignment) {
      group.assignedTopics.set(item.topic.assignment.category, (group.assignedTopics.get(item.topic.assignment.category) ?? 0) + 1);
    }
    countsByOldCategory.set(key, group);
  }

  const existingCategoryAnalysis = [...countsByOldCategory.values()].map((group) => ({
    category: group.category,
    count: group.records.length,
    percentage: roundPercentage(group.records.length, questions.length),
    imageCount: group.records.filter((question) => Boolean(question.image)).length,
    proposedTopicCounts: [...group.assignedTopics].map(([topic, count]) => ({ category: topic, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "en")),
    examples: exampleRecords(group.records),
  })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "en"));

  const typeAnalysis = topicTypeRules.map((rule) => {
    const records = analyses.filter((item) => item.questionTypes.includes(rule.key)).map((item) => item.question);
    return { key: rule.key, label: rule.label, description: rule.description, count: records.length, percentage: roundPercentage(records.length, questions.length), questionIds: records.map((question) => question.id).sort((a, b) => a - b), examples: exampleRecords(records, 5) };
  });

  const uncertainReport = uncertain.map(({ question, topic }) => ({
    id: question.id,
    question: question.question,
    existingCategory: categoryLabel(question),
    hasImage: Boolean(question.image),
    image: question.image,
    candidatePaths: topic.candidatePaths,
    reasons: topic.uncertaintyReasons,
  })).sort((a, b) => a.id - b.id);

  const imageCounts = {
    withImage: questions.filter((question) => Boolean(question.image)).length,
    withoutImage: questions.filter((question) => !question.image).length,
    imageIdentificationCount: typeAnalysis.find((item) => item.key === "roadSignOrImageIdentification")?.count ?? 0,
  };

  return {
    taxonomy,
    assigned,
    uncertainReport,
    existingCategoryAnalysis,
    typeAnalysis,
    imageCounts,
    source: {
      path: "src/data/questions.json",
      envelopeCount: envelope.count,
      actualCount: questions.length,
      uniqueIdCount: new Set(questions.map((question) => question.id)).size,
      answerOptionCounts: Object.fromEntries([...new Set(questions.map((question) => question.answers.length))].sort((a, b) => a - b).map((count) => [String(count), questions.filter((question) => question.answers.length === count).length])),
      nullCorrectAnswerCount: questions.filter((question) => question.correctAnswer === null).length,
      nullExplanationCount: questions.filter((question) => question.explanation === null).length,
      missingImageCount: imageCounts.withoutImage,
    },
    byId,
  };
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function markdownTable(headers, rows) {
  const separator = headers.map(() => "---");
  const escape = (value) => String(value).replaceAll("|", "\\|").replace(/\s*\n\s*/g, " ");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

function buildMarkdown(analysis, total) {
  const categoryRows = analysis.taxonomy.map((category) => [category.category, category.count, formatPercent(category.percentage)]);
  const existingRows = analysis.existingCategoryAnalysis.map((item) => [item.category, item.count, formatPercent(item.percentage), item.imageCount, item.proposedTopicCounts.slice(0, 4).map((entry) => `${entry.category} (${entry.count})`).join("; ") || "No confident taxonomy matches"]);
  const sections = [
    "# Question Dataset Analysis",
    "",
    `Source: \`${analysis.source.path}\` (${total} questions). This report and the proposed taxonomy are analysis artifacts only; they do not modify the scraped dataset or production app. The taxonomy is inferred from the supplied fields and is not asserted to match official RSA/Prometric sections. No authoritative source was used to establish such a correspondence.`,
    "",
    "## Dataset Profile",
    "",
    `- Envelope count: ${analysis.source.envelopeCount}; parsed records: ${analysis.source.actualCount}; unique IDs: ${analysis.source.uniqueIdCount}.`,
    `- Answer counts: ${Object.entries(analysis.source.answerOptionCounts).map(([count, quantity]) => `${quantity} with ${count} options`).join(", ")}.`,
    `- Images: ${analysis.imageCounts.withImage} present, ${analysis.imageCounts.withoutImage} absent; ${analysis.imageCounts.imageIdentificationCount} appear to ask for image/sign/signal identification by wording and image presence.`,
    `- Null correct answers: ${analysis.source.nullCorrectAnswerCount}; null explanations: ${analysis.source.nullExplanationCount}.`,
    "",
    "## Method and Limits",
    "",
    "The analyzer applies deterministic phrase/regex signals to each question, all answer options, the correct answer and the explanation. Question wording receives the strongest score; answer and explanation text provide corroboration. Existing category and image presence are audited as separate fields rather than allowed to dictate the taxonomy. Questions with close topic scores, weak text evidence, or generic image-dependent prompts are placed in the uncertain report rather than forced into a category. IDs and example ordering are numeric and stable.",
    "",
    "This is a transparent heuristic proposal, not expert annotation. It can miss synonyms or misread a long explanation that discusses a secondary concept. Image presence is available in the JSON, but the remote image contents are not visually interpreted by this script; generic image-led prompts are therefore especially likely to be marked uncertain. Percentages use all 805 questions as the denominator; taxonomy category counts exclude uncertain items and therefore do not sum to 805.",
    "",
    "## Proposed Top-Level Categories",
    "",
    markdownTable(["Category", "Questions", "% of dataset"], categoryRows),
    "",
    `Confident taxonomy assignments: ${analysis.assigned.length} (${formatPercent(roundPercentage(analysis.assigned.length, total))}). Uncertain/unassigned: ${analysis.uncertainReport.length} (${formatPercent(roundPercentage(analysis.uncertainReport.length, total))}).`,
    "",
    "## Category and Subcategory Detail",
    "",
  ];

  for (const category of analysis.taxonomy) {
    sections.push(`### ${category.category} — ${category.count} (${formatPercent(category.percentage)})`, "", `Examples: ${category.examples.map((example) => `#${example.id}: “${example.question}”`).join("; ")}`, "", markdownTable(["Subcategory", "Questions", "% of dataset", "Example IDs and question text"], category.subcategories.map((subcategory) => [
      subcategory.name,
      subcategory.count,
      formatPercent(subcategory.percentage),
      subcategory.examples.map((example) => `#${example.id} “${example.question}”`).join("; "),
    ])), "");
  }

  sections.push(
    "## Existing Category Field (Separate Audit)",
    "",
    "The existing values are scraper-provided labels, not a reliable hierarchical topic system in this dataset. The cross-tab below shows how confidently assigned content-derived topics are distributed within each existing label; uncertain records are omitted from the cross-tab but remain in each original label's count. The examples are verbatim dataset prompts.",
    "",
    markdownTable(["Existing value", "Questions", "% of dataset", "With image", "Most common confident proposed topics"], existingRows),
    "",
  );

  for (const item of analysis.existingCategoryAnalysis) {
    sections.push(`### Existing value: ${item.category}`, "", `Contains ${item.count} questions (${formatPercent(item.percentage)}); ${item.imageCount} have an image. Confident content-derived topic matches are shown in the table above. Examples: ${item.examples.map((example) => `#${example.id}: “${example.question}”`).join("; ")}.`, "");
  }

  sections.push(
    "## Question-Form and Image Signals",
    "",
    "These dimensions are overlapping heuristics, so their counts are not expected to add to 805. Numerical/calculation-oriented includes factual limits and quantities as well as arithmetic-style wording; it does not claim that every such question requires calculation.",
    "",
    markdownTable(["Signal", "Questions", "% of dataset", "Examples"], analysis.typeAnalysis.map((item) => [item.label, item.count, formatPercent(item.percentage), item.examples.slice(0, 3).map((example) => `#${example.id}: “${example.question}”`).join("; ")])),
    "",
    "## Uncertain Questions",
    "",
    `The following ${analysis.uncertainReport.length} records were not assigned to the taxonomy. Candidate paths and reasons are retained in the JSON. This includes close topical overlaps, insufficient text signals and prompts whose meaning depends on a scenario image.`,
    "",
  );

  for (const item of analysis.uncertainReport) {
    const candidates = item.candidatePaths.map((path) => `${path.category} → ${path.subcategory} (${path.score})`).join("; ") || "No confident candidate";
    sections.push(`- **#${item.id}** (${item.existingCategory}; image: ${item.hasImage ? "yes" : "no"}): “${item.question}” — ${candidates}. ${item.reasons.join(" ")}`);
  }

  sections.push(
    "",
    "## Interpretation",
    "",
    "The content-derived families are useful for organizing this question bank, but the source itself does not establish that they correspond to official RSA/Prometric test sections. The existing field has some signal (for example, a large cluster of image-based sign questions under Control of Vehicle), but it also mixes signs, parking, insurance/licensing and operational knowledge. Managing Risk spans many unrelated subject families. It should not be treated as the finished taxonomy without question-level review.",
    "",
    "Run `node scripts/analyse-questions.mjs` to regenerate both outputs. The script reads the source dataset and writes only `reports/question-analysis.md` and `reports/question-taxonomy.json`.",
    "",
  );
  return sections.join("\n");
}

function validatePartition(analysis, questions) {
  const assignedIds = analysis.assigned.map((item) => item.question.id);
  const uncertainIds = analysis.uncertainReport.map((item) => item.id);
  const allIds = [...assignedIds, ...uncertainIds];
  if (allIds.length !== questions.length || new Set(allIds).size !== questions.length) {
    throw new Error(`Taxonomy partition invalid: ${allIds.length} assignments for ${questions.length} questions, ${new Set(allIds).size} unique IDs.`);
  }
  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    throw new Error("Source question IDs are not unique.");
  }
  if (analysis.source.envelopeCount !== questions.length) {
    throw new Error(`Dataset envelope says ${analysis.source.envelopeCount}; parsed ${questions.length}.`);
  }
}

async function main() {
  const dataset = JSON.parse(await readFile(sourcePath, "utf8"));
  if (!Array.isArray(dataset.questions)) throw new Error("Expected a questions array in src/data/questions.json.");
  const questions = dataset.questions;
  const analysis = buildAnalysis(questions, dataset);
  validatePartition(analysis, questions);

  const questionTypesById = Object.fromEntries(analysis.assigned.concat(analysis.uncertainReport.map((item) => ({ question: analysis.byId.get(item.id) })))
    .map(({ question }) => [String(question.id), classifyQuestionType(question)]));
  const taxonomyJson = {
    title: "Proposed content-derived question taxonomy",
    source: "src/data/questions.json",
    datasetCount: questions.length,
    percentageDenominator: questions.length,
    method: "Deterministic phrase/regex scoring across question, answer options, correct answer and explanation; ambiguous or weakly supported records remain under uncertain.",
    notOfficialClassification: true,
    assignedCount: analysis.assigned.length,
    uncertainCount: analysis.uncertainReport.length,
    categories: analysis.taxonomy,
    uncertain: analysis.uncertainReport,
    questionTypeAnalysis: analysis.typeAnalysis,
    questionTypesById,
  };
  const markdown = buildMarkdown(analysis, questions.length);
  await mkdir(dirname(reportPath), { recursive: true });
  await Promise.all([
    writeFile(reportPath, markdown, "utf8"),
    writeFile(taxonomyPath, `${JSON.stringify(taxonomyJson, null, 2)}\n`, "utf8"),
  ]);

  console.log(`Analyzed ${questions.length} questions.`);
  console.log(`Assigned: ${analysis.assigned.length}; uncertain: ${analysis.uncertainReport.length}.`);
  for (const category of analysis.taxonomy) console.log(`${category.category}: ${category.count} (${formatPercent(category.percentage)})`);
  console.log(`Reports written to ${reportPath} and ${taxonomyPath}.`);
}

await main();