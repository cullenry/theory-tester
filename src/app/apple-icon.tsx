import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16704c",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 104,
            height: 26,
            borderRadius: 13,
            background: "#ffffff",
            position: "absolute",
            top: 39,
          }}
        />
        <div
          style={{
            width: 26,
            height: 76,
            borderRadius: 13,
            background: "#ffffff",
            position: "absolute",
            top: 58,
          }}
        />
        <div
          style={{
            width: 80,
            height: 7,
            borderRadius: 4,
            background: "#cde8d5",
            position: "absolute",
            bottom: 42,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
