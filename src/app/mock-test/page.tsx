export default function MockTestPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-semibold text-blue-600">← TheoryTester</a>
        <div className="mt-12 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Mock test</p>
          <h1 className="mt-3 text-3xl font-black text-gray-950">Mock exams coming next.</h1>
          <p className="mt-4 leading-7 text-gray-600">
            The mock-test route is ready for the timed exam experience and scoring engine.
          </p>
        </div>
      </div>
    </main>
  );
}
