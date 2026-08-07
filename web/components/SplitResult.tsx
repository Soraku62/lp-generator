import type {
  GridCell,
  GridInfo
} from "../types/api";
import { panelStyle } from "./styles";

type SplitResultProps = {
  gridInfo: GridInfo | null;
  gridCells: GridCell[];
};

export function SplitResult({
  gridInfo,
  gridCells
}: SplitResultProps) {
  if (!gridInfo || gridCells.length === 0) {
    return null;
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 12px" }}>
        Split Result
      </h3>

      <p
        style={{
          margin: "0 0 14px",
          color: "#94a3b8",
          fontSize: 14
        }}
      >
        {gridInfo.rows} × {gridInfo.cols} grid /{" "}
        {gridCells.length} cells / {gridInfo.cellWidth}px ×{" "}
        {gridInfo.cellHeight}px
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 8
        }}
      >
        {gridCells.map((cell) => (
          <div
            key={cell.id}
            style={{
              padding: 10,
              borderRadius: 12,
              background:
                "rgba(2, 6, 23, 0.55)",
              border:
                "1px solid rgba(148, 163, 184, 0.18)",
              fontSize: 12,
              color: "#cbd5e1"
            }}
          >
            <strong style={{ color: "#e5e7eb" }}>
              {cell.id}
            </strong>
            <br />
            x:{cell.x}, y:{cell.y}
            <br />
            w:{cell.width}, h:{cell.height}
          </div>
        ))}
      </div>
    </div>
  );
}
