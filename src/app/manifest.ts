import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TheoryPrep — Irish Car Theory Test Practice",
    short_name: "TheoryPrep",
    description: "Practise Irish driving theory test questions for 2026, build your confidence and take timed mock tests.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8faf8",
    theme_color: "#16704c",
    categories: ["education", "automotive"],
    lang: "en-IE",
    icons: [
      { src: "/icons/theoryprep-book.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Start practice", short_name: "Practice", url: "/practice" },
      { name: "Learn the course", short_name: "Learn", url: "/practice/learn" },
      { name: "Take a mock test", short_name: "Mock test", url: "/mock-test" },
      { name: "Offline practice", short_name: "Offline", url: "/offline-practice" },
    ],
  };
}