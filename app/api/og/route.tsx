import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "whatelz.ai").slice(0, 120);
  const subtitle = (
    searchParams.get("subtitle") ??
    "What else can you build with AI? — Edmund Lin Zhenming"
  ).slice(0, 200);
  const eyebrow = (searchParams.get("eyebrow") ?? "whatelz.ai").slice(0, 40);

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: "#fafaf9",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 20,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#71717a",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            background: "#f59e0b",
            marginRight: 20,
          }}
        />
        {eyebrow}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#18181b",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#52525b",
            lineHeight: 1.3,
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: "#71717a",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        <div>whatelz.ai</div>
        <div>Edmund Lin Zhenming</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
