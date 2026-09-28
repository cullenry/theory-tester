export default function PracticePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-semibold text-blue-600">← TheoryTester</a>
        <div className="mt-12 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Practice</p>
          <h1 className="mt-3 text-3xl font-black text-gray-950">Question engine coming next.</h1>
          <p className="mt-4 leading-7 text-gray-600">
            This route is ready. Next we’ll add the question dataset, answer selection,
            instant feedback and progress tracking.
          </p>
        </div>
      </div>
    </main>
  );
}
