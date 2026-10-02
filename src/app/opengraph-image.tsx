import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "TheoryPrep — Irish Driving Theory Test 2026";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#f0f6f0",
          color: "#17231d",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background: "#16704c",
              color: "#ffffff",
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#16704c" }}>
              THEORYPREP
            </div>
            <div style={{ fontSize: 17, color: "#66746b", marginTop: 4 }}>
              Independent Irish driving theory test practice
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2 }}>
            Irish Driving Theory Test 2026
          </div>
          <div style={{ marginTop: 26, fontSize: 29, lineHeight: 1.3, color: "#536158" }}>
            Practice 805 questions, learn with clear explanations and take timed mock tests.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 22, fontWeight: 700 }}>
          <span>805 questions</span>
          <span style={{ color: "#8a968f" }}>•</span>
          <span>40-question mock</span>
          <span style={{ color: "#8a968f" }}>•</span>
          <span style={{ color: "#16704c" }}>Free</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
