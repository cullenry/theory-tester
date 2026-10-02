import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "TheoryPrep — Irish Driving Theory Test 2026";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const imageUrl = "https://theoryprep.irish/images/theoryprep-og.jpg";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <img
          src={imageUrl}
          width="1200"
          height="630"
          style={{
            width: "1200px",
            height: "630px",
            objectFit: "cover",
            display: "block",
          }}
          alt=""
        />
      </div>
    ),
    { ...size },
  );
}
