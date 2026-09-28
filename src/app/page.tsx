const topics = [
  { icon: "🚦", title: "Rules of the Road", description: "Road rules, markings and right of way." },
  { icon: "🛑", title: "Road Signs", description: "Learn what signs mean and where you’ll see them." },
  { icon: "🚗", title: "Safe Driving", description: "Speed, stopping distances and responsible driving." },
  { icon: "⚠️", title: "Hazards & Risk", description: "Recognise hazards before they become dangerous." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-black tracking-tight">
          Theory<span className="text-blue-600">Tester</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold text-gray-600">
          <a className="hidden transition hover:text-gray-950 sm:block" href="#topics">Topics</a>
          <a className="rounded-full bg-gray-950 px-5 py-2.5 text-white transition hover:bg-gray-800" href="/practice">
            Practice
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Built for smarter practice
          </div>

          <h1 className="text-5xl font-black tracking-tight text-gray-950 sm:text-7xl">
            Pass your theory test with{" "}
            <span className="text-blue-600">confidence.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
            Practice real-style questions, find your weak areas and build the confidence
            you need before test day.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/practice"
              className="rounded-2xl bg-blue-600 px-7 py-4 text-center font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Start practising →
            </a>
            <a
              href="/mock-test"
              className="rounded-2xl border border-gray-200 bg-white px-7 py-4 text-center font-bold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Take a mock test
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            ["Questions", "Practice at your pace"],
            ["Mock tests", "Test yourself under pressure"],
            ["Progress", "See where to improve"],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="font-bold text-gray-950">{title}</p>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="topics" className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Practice by topic</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Focus on what matters.
            </h2>
            <p className="mt-4 text-gray-600">
              Start broad or drill into the areas you need to improve most.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {topics.map((topic) => (
              <a
                href="/practice"
                key={topic.title}
                className="group rounded-3xl border border-gray-200 bg-gray-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="text-3xl">{topic.icon}</div>
                <h3 className="mt-5 text-xl font-bold text-gray-950">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{topic.description}</p>
                <span className="mt-5 inline-block text-sm font-bold text-blue-600 group-hover:translate-x-1 transition">
                  Practise this topic →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-500">
        TheoryTester · Practice smarter.
      </footer>
    </main>
  );
}
