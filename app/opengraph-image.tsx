import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clinical Note Co-pilot — structured SOAP notes from messy clinical text";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamically generated OG image using Next's ImageResponse / Edge runtime.
 * No file to commit, no design drift — keeps in sync with the live tokens.
 */
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(124,242,197,0.10) 0%, transparent 60%), #07080a",
          color: "#e7eaf0",
          fontFamily: "Inter, ui-sans-serif, system-ui",
          position: "relative",
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(31,36,44,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,36,44,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.7,
          }}
        />

        {/* header chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: "#7cf2c5",
              color: "#062018",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            CN
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#9aa3b2", letterSpacing: -0.2 }}>
            Clinical Note Co-pilot
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            fontWeight: 600,
            maxWidth: 1000,
          }}
        >
          Structured SOAP notes from messy clinical text, with the model's reasoning visible.
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 60,
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#5f6776",
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            <span>Web app</span>
            <span>·</span>
            <span>MCP server</span>
            <span>·</span>
            <span>Eval harness</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(240,201,135,0.4)",
              background: "rgba(42,29,18,0.6)",
              color: "#f0c987",
              fontSize: 16,
            }}
          >
            Synthetic data only
          </div>
        </div>
      </div>
    ),
    size
  );
}
