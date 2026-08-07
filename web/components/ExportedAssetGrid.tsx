import type {
  CSSProperties
} from "react";

import type { ExportedAsset } from "../types/api";
import { panelStyle } from "./styles";

export function ExportedAssetGrid({
  assets
}: {
  assets: ExportedAsset[];
}) {
  if (assets.length === 0) {
    return null;
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 12px" }}>
        PNG Assets
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 12
        }}
      >
        {assets.map((asset) => (
          <div key={asset.id} style={checkerCardStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.id}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "contain",
                display: "block"
              }}
            />

            <p
              style={{
                margin: "8px 0 0",
                color: "#cbd5e1",
                fontSize: 12,
                textAlign: "center"
              }}
            >
              {asset.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const checkerCardStyle: CSSProperties = {
  padding: 10,
  borderRadius: 14,
  background:
    "linear-gradient(45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.18) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition:
    "0 0, 0 9px, 9px -9px, -9px 0px",
  border:
    "1px solid rgba(148, 163, 184, 0.18)"
};
