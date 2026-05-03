import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenBrain Dashboard — operator console for openbrain-ros";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(circle at 30% 30%, rgba(26,98,255,0.35) 0%, rgba(0,0,0,0) 60%), #0a0a0a",
          color: "#fafafa",
          padding: "80px",
          justifyContent: "space-between",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: 0.85 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(80,150,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ⌬
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>OpenBrain</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>
            One brain, any bot.
          </div>
          <div style={{ fontSize: 30, opacity: 0.7, maxWidth: 900, lineHeight: 1.3 }}>
            Web operator console for robots running openbrain-ros — teleop, missions, health,
            fleet, all from the browser.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, opacity: 0.55 }}>dashboard.openkinematics.com</div>
          <div
            style={{
              fontSize: 18,
              padding: "10px 18px",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              opacity: 0.8,
            }}
          >
            Try the demo · ?demo=1
          </div>
        </div>
      </div>
    ),
    size,
  );
}
