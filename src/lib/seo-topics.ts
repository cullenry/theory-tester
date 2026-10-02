export type SeoTopicPage = {
  slug: string;
  category: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: { title: string; body: string }[];
};

export const seoTopicPages: SeoTopicPage[] = [
  {
    slug: "irish-theory-test-vehicle-safety",
    category: "Vehicle condition, equipment and maintenance",
    eyebrow: "Vehicle condition and safety",
    title: "Irish Theory Test Vehicle Safety Questions",
    description: "Practice Irish driving theory test questions about vehicle condition, equipment, maintenance, tyres, brakes, lights and safety.",
    intro: "Focus on vehicle condition, equipment and maintenance questions with answers and explanations. Practice the areas that can be easy to overlook before taking your Irish driving theory test.",
    sections: [
      { title: "Vehicle safety practice", body: "Work through questions on brakes, tyres, lights, mirrors, fluids, restraints, towing and other vehicle-safety topics." },
      { title: "Learn from explanations", body: "Use each explanation to understand why an answer is correct instead of relying on memorisation alone." },
      { title: "Mix it back into practice", body: "Once you have strengthened vehicle topics, return to mixed questions or a timed mock test." },
    ],
  },
  {
    slug: "irish-theory-test-road-positioning",
    category: "Road positioning and manoeuvres",
    eyebrow: "Road positioning and manoeuvres",
    title: "Irish Theory Test Road Positioning Questions",
    description: "Practice Irish theory test questions about road positioning, lane use, overtaking, turning, roundabouts and manoeuvres.",
    intro: "Practice road positioning and manoeuvre questions with clear answers and explanations, then test yourself under mixed conditions.",
    sections: [
      { title: "Master positioning", body: "Focus on questions about lane position, turning, overtaking, roundabouts and choosing a safe road position." },
      { title: "Understand the situation", body: "Scenario-based questions reward careful reading of what is happening around the vehicle." },
      { title: "Build mixed-test confidence", body: "After focused practice, use a full mock to check that you can apply positioning rules alongside other topics." },
    ],
  },
  {
    slug: "irish-theory-test-hazard-awareness",
    category: "Road conditions, visibility and hazard awareness",
    eyebrow: "Hazard awareness",
    title: "Irish Theory Test Hazard Awareness Questions",
    description: "Practice Irish driving theory test questions about hazards, visibility, weather, road conditions and safe reactions.",
    intro: "Build hazard-awareness skills with Irish theory test questions covering visibility, weather, road conditions and situations where a driver needs to anticipate risk.",
    sections: [
      { title: "Spot the hazard", body: "Practice questions that ask what a driver should notice, anticipate or prepare for in changing road conditions." },
      { title: "Think beyond the obvious", body: "Use explanations to connect road conditions and visibility with the safest response." },
      { title: "Reinforce weak areas", body: "Return to questions you miss and then mix hazard awareness into longer practice sessions." },
    ],
  },
  {
    slug: "irish-theory-test-road-law",
    category: "Licensing, road law and driver responsibilities",
    eyebrow: "Road law and responsibilities",
    title: "Irish Theory Test Road Law Questions",
    description: "Practice Irish theory test questions about licensing, road law, legal responsibilities and rules drivers need to know.",
    intro: "Review Irish driving theory questions about licensing, legal responsibilities and road rules, with explanations to help reinforce the detail.",
    sections: [
      { title: "Know the rules", body: "Focus on questions covering licensing, legal duties, documents, restrictions and driver responsibilities." },
      { title: "Use explanations to revise", body: "Read the reasoning after each answer so that rules are easier to remember in context." },
      { title: "Test yourself under pressure", body: "Use focused practice first, then move into a timed mock test to check recall without hints." },
    ],
  },
  {
    slug: "irish-theory-test-vehicle-control",
    category: "Vehicle control, speed and stability",
    eyebrow: "Vehicle control and speed",
    title: "Irish Theory Test Vehicle Control Questions",
    description: "Practice Irish theory test questions about speed, vehicle control, stability, stopping and safe handling.",
    intro: "Practice the questions that cover vehicle control, speed and stability, including how driving choices affect stopping and handling.",
    sections: [
      { title: "Control and stability", body: "Review questions on speed choice, stopping, grip, stability and how vehicle control changes in different situations." },
      { title: "Learn the reasoning", body: "Explanations help connect the correct answer to the physical effect on the vehicle and the road situation." },
      { title: "Apply it in a mock", body: "Finish with a timed mixed test to make sure vehicle-control knowledge holds up alongside other topics." },
    ],
  },
  {
    slug: "irish-theory-test-emergencies-first-aid",
    category: "Emergencies, collisions and first aid",
    eyebrow: "Emergencies and first aid",
    title: "Irish Theory Test Emergencies and First Aid Questions",
    description: "Practice Irish driving theory test questions about collisions, emergencies, breakdowns and first aid.",
    intro: "Prepare for emergency and first-aid questions with focused Irish theory test practice and clear explanations.",
    sections: [
      { title: "Emergency situations", body: "Practice questions about breakdowns, collisions and what a driver should do when something goes wrong." },
      { title: "First-aid knowledge", body: "Use explanations to reinforce the correct response in questions involving first aid and road incidents." },
      { title: "Keep the topic in rotation", body: "Mix emergency questions into regular practice so the knowledge remains familiar." },
    ],
  },
  {
    slug: "irish-theory-test-vulnerable-road-users",
    category: "Vulnerable road users and sharing the road",
    eyebrow: "Sharing the road",
    title: "Irish Theory Test Vulnerable Road Users Questions",
    description: "Practice Irish theory test questions about cyclists, pedestrians, motorcyclists, vulnerable road users and sharing the road safely.",
    intro: "Build confidence with questions about vulnerable road users and safe sharing of Irish roads, supported by explanations after each answer.",
    sections: [
      { title: "Cyclists and pedestrians", body: "Focus on situations where drivers need to give vulnerable road users space, time and consideration." },
      { title: "Read the road situation", body: "Scenario questions can test how you react to different road users, so pay attention to the whole situation." },
      { title: "Bring it into mixed practice", body: "Use focused sessions first, then check your overall recall with mixed questions." },
    ],
  },
  {
    slug: "irish-theory-test-driver-fitness",
    category: "Driver fitness and responsible conduct",
    eyebrow: "Driver fitness",
    title: "Irish Theory Test Driver Fitness Questions",
    description: "Practice Irish theory test questions about driver fitness, fatigue, alcohol, drugs, distraction and responsible driving.",
    intro: "Revise driver-fitness and responsible-conduct questions covering the factors that can affect a driver's ability to drive safely.",
    sections: [
      { title: "Fitness to drive", body: "Practice questions about fatigue, impairment, distraction and other factors that can affect driving." },
      { title: "Understand the risk", body: "Use explanations to connect each rule with its effect on concentration, judgement and safe driving." },
      { title: "Keep practicing", body: "Revisit missed questions and then use a mixed or timed session to reinforce the topic." },
    ],
  },
  {
    slug: "irish-theory-test-eco-driving",
    category: "Efficient and environmentally responsible driving",
    eyebrow: "Efficient and responsible driving",
    title: "Irish Theory Test Eco Driving Questions",
    description: "Practice Irish driving theory test questions about fuel-efficient, smooth and environmentally responsible driving.",
    intro: "Review theory test questions about efficient and environmentally responsible driving, with straightforward explanations after each answer.",
    sections: [
      { title: "Drive efficiently", body: "Practice questions about smooth driving, efficient vehicle use and choices that can reduce unnecessary fuel consumption." },
      { title: "Learn the practical reason", body: "Explanations show how the recommended driving behaviour relates to efficiency and responsible road use." },
      { title: "Check your wider knowledge", body: "After focused revision, switch back to mixed questions or a timed mock test." },
    ],
  },
];
