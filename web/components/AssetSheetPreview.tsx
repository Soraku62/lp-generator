import type { GridCell } from "../types/api";
import { EmptyPreview, PreviewCard } from "./PreviewCard";
import { imageStyle } from "./styles";

type AssetSheetPreviewProps = {
  assetSheetUrl: string;
  gridCells: GridCell[];
};

export function AssetSheetPreview({
  assetSheetUrl,
  gridCells
}: AssetSheetPreviewProps) {
  return (
    <PreviewCard title="Asset Sheet">
      {assetSheetUrl ? (
        <div style={{ position: "relative", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetSheetUrl}
            alt="Generated asset sheet"
            style={imageStyle}
          />

          {gridCells.map((cell) => (
            <div
              key={cell.id}
              title={cell.id}
              style={{
                position: "absolute",
                left: `${(cell.x / 1024) * 100}%`,
                top: `${(cell.y / 1024) * 100}%`,
                width: `${(cell.width / 1024) * 100}%`,
                height: `${(cell.height / 1024) * 100}%`,
                border:
                  "1px solid rgba(56, 189, 248, 0.8)",
                boxSizing: "border-box",
                pointerEvents: "none"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 6,
                  top: 6,
                  padding: "2px 6px",
                  borderRadius: 999,
                  background:
                    "rgba(2, 6, 23, 0.75)",
                  color: "#7dd3fc",
                  fontSize: 11
                }}
              >
                {cell.id}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPreview text="Asset sheet will appear here." />
      )}
    </PreviewCard>
  );
}
