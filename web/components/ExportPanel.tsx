import { panelStyle } from "./styles";

type ExportPanelProps = {
  zipUrl: string;
  assetCount: number;
};

export function ExportPanel({
  zipUrl,
  assetCount
}: ExportPanelProps) {
  if (!zipUrl) {
    return null;
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 12px" }}>
        Exported Assets
      </h3>

      <a
        href={zipUrl}
        download
        style={{
          display: "inline-block",
          padding: "12px 16px",
          borderRadius: 14,
          background:
            "linear-gradient(135deg, #38bdf8, #8b5cf6)",
          color: "white",
          fontWeight: 800,
          textDecoration: "none"
        }}
      >
        Download ZIP
      </a>

      <p
        style={{
          margin: "12px 0 0",
          color: "#94a3b8",
          fontSize: 13
        }}
      >
        {assetCount} transparent PNG assets exported.
      </p>
    </div>
  );
}
