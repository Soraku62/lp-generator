"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiResult = {
  success: boolean;
  data: any;
  error: null | {
    code: string;
    message: string;
    details?: any;
  };
};

type GridCell = {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ExportedAsset = {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fileName: string;
  imageUrl: string;
};

async function readJsonResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `API did not return JSON. Status: ${response.status}. Response preview: ${text.slice(
        0,
        200
      )}`
    );
  }
}

export default function Home() {
  const [serviceName, setServiceName] = useState("aiment");
  const [concept, setConcept] = useState(
    "A service where Japanese learners can practice conversation in a fun and natural way."
  );
  const [targetUser, setTargetUser] = useState(
    "International Japanese learners who want speaking practice."
  );
  const [tone, setTone] = useState("modern, soft, futuristic, clean");
  const [mainMessage, setMainMessage] = useState(
    "Learn Japanese by speaking, not just studying."
  );

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState<number | null>(null);
  const [lpImageUrl, setLpImageUrl] = useState("");
  const [assetSheetUrl, setAssetSheetUrl] = useState("");
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [gridInfo, setGridInfo] = useState<any>(null);

  const [exportedAssets, setExportedAssets] = useState<ExportedAsset[]>([]);
  const [zipUrl, setZipUrl] = useState("");

  async function handleGenerateAll() {
    setLoading(true);
    setError("");
    setCurrentStep("");

    setProjectId(null);
    setLpImageUrl("");
    setAssetSheetUrl("");
    setGridCells([]);
    setGridInfo(null);
    setExportedAssets([]);
    setZipUrl("");

    try {
      if (!API_BASE_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_BASE_URL is not set. Check web/.env.local."
        );
      }

      // 1. LPプロジェクト作成
      setCurrentStep("1/5 Creating LP project...");

      const createResponse = await fetch(`${API_BASE_URL}/generate-lp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serviceName,
          concept,
          targetUser,
          tone,
          mainMessage
        })
      });

      const createResult = await readJsonResponse(createResponse);

      if (!createResult.success) {
        throw new Error(
          createResult.error?.message || "Failed to create LP project."
        );
      }

      const newProjectId = createResult.data.id;
      setProjectId(newProjectId);

      // 2. LP画像生成
      setCurrentStep("2/5 Generating LP image...");

      const imageResponse = await fetch(
        `${API_BASE_URL}/projects/${newProjectId}/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );

      const imageResult = await readJsonResponse(imageResponse);

      if (!imageResult.success) {
        throw new Error(
          imageResult.error?.details?.body ||
            imageResult.error?.message ||
            "Failed to generate LP image."
        );
      }

      const newLpImageUrl = imageResult.data.imageUrl;
      setLpImageUrl(newLpImageUrl);

      // 3. 素材シート生成
      setCurrentStep("3/5 Generating asset sheet...");

      const assetSheetResponse = await fetch(
        `${API_BASE_URL}/projects/${newProjectId}/generate-asset-sheet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );

      const assetSheetResult = await readJsonResponse(assetSheetResponse);

      if (!assetSheetResult.success) {
        throw new Error(
          assetSheetResult.error?.details?.body ||
            assetSheetResult.error?.message ||
            "Failed to generate asset sheet."
        );
      }

      const newAssetSheetUrl = assetSheetResult.data.assetSheetUrl;
      setAssetSheetUrl(newAssetSheetUrl);

      // 4. 素材シートをグリッド分割
      setCurrentStep("4/5 Splitting asset sheet into grid cells...");

      const splitResponse = await fetch(`${API_BASE_URL}/split-grid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageUrl: newAssetSheetUrl,
          imageWidth: 1024,
          imageHeight: 1024,
          rows: 4,
          cols: 4
        })
      });

      const splitResult = await readJsonResponse(splitResponse);

      if (!splitResult.success) {
        throw new Error(
          splitResult.error?.message || "Failed to split asset sheet."
        );
      }

      setGridCells(splitResult.data.cells);
      setGridInfo(splitResult.data.grid);

      // 5. 透過PNG素材とZIPを書き出し
      setCurrentStep("5/5 Exporting transparent PNG assets...");

      const exportResponse = await fetch(
        `${API_BASE_URL}/projects/${newProjectId}/export-assets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );

      const exportResult = await readJsonResponse(exportResponse);

      if (!exportResult.success) {
        throw new Error(
          exportResult.error?.details?.message ||
            exportResult.error?.message ||
            "Failed to export assets."
        );
      }

      setExportedAssets(exportResult.data.assets);
      setZipUrl(exportResult.data.zipUrl);

      setCurrentStep("Done");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setCurrentStep("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        background:
          "radial-gradient(circle at top left, #1e3a8a 0, transparent 32%), radial-gradient(circle at top right, #6d28d9 0, transparent 28%), #020617",
        color: "#e5e7eb",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 28
        }}
      >
        <section>
          <p
            style={{
              display: "inline-block",
              margin: "0 0 12px",
              padding: "6px 12px",
              border: "1px solid rgba(125, 211, 252, 0.35)",
              borderRadius: 999,
              color: "#7dd3fc",
              fontSize: 13
            }}
          >
            LP Generator API Prototype
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(36px, 6vw, 72px)",
              letterSpacing: "-0.06em",
              lineHeight: 0.95
            }}
          >
            Generate. Assetize. Split. Export.
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 720,
              color: "#94a3b8",
              fontSize: 17,
              lineHeight: 1.7
            }}
          >
            Generate a landing page image, recreate it as an asset sheet, split
            the sheet into grid-based cells, export transparent PNG assets, and
            download them as a ZIP.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 420px) 1fr",
            gap: 24,
            alignItems: "start"
          }}
        >
          <div
            style={{
              padding: 22,
              border: "1px solid rgba(148, 163, 184, 0.22)",
              borderRadius: 24,
              background: "rgba(15, 23, 42, 0.72)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.28)"
            }}
          >
            <h2 style={{ margin: "0 0 18px", fontSize: 22 }}>Input</h2>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={labelStyle}>
                Service Name
                <input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Concept
                <textarea
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  rows={4}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Target User
                <textarea
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Tone
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Main Message
                <textarea
                  value={mainMessage}
                  onChange={(e) => setMainMessage(e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
              </label>

              <button
                onClick={handleGenerateAll}
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: "14px 16px",
                  border: "none",
                  borderRadius: 14,
                  background: loading
                    ? "linear-gradient(135deg, #475569, #334155)"
                    : "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 16px 40px rgba(59,130,246,0.35)"
                }}
              >
                {loading
                  ? "Generating..."
                  : "Generate LP + Asset Sheet + Export ZIP"}
              </button>

              {currentStep && (
                <p
                  style={{
                    margin: "4px 0 0",
                    color: currentStep === "Failed" ? "#fca5a5" : "#7dd3fc",
                    fontSize: 13
                  }}
                >
                  Status: {currentStep}
                </p>
              )}

              {projectId !== null && (
                <p
                  style={{
                    margin: 0,
                    color: "#94a3b8",
                    fontSize: 13
                  }}
                >
                  Project ID: {projectId}
                </p>
              )}

              {error && (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    margin: "8px 0 0",
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(127, 29, 29, 0.35)",
                    color: "#fecaca",
                    fontSize: 12,
                    lineHeight: 1.5
                  }}
                >
                  {error}
                </pre>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 24 }}>
            <PreviewCard title="Landing Page Image">
              {lpImageUrl ? (
                <img src={lpImageUrl} alt="Generated LP" style={imageStyle} />
              ) : (
                <EmptyPreview text="LP image will appear here." />
              )}
            </PreviewCard>

            <PreviewCard title="Asset Sheet">
              {assetSheetUrl ? (
                <div style={{ position: "relative", width: "100%" }}>
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
                        border: "1px solid rgba(56, 189, 248, 0.8)",
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
                          background: "rgba(2, 6, 23, 0.75)",
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

            {gridInfo && gridCells.length > 0 && (
              <div style={panelStyle}>
                <h3 style={{ margin: "0 0 12px" }}>Split Result</h3>

                <p
                  style={{
                    margin: "0 0 14px",
                    color: "#94a3b8",
                    fontSize: 14
                  }}
                >
                  {gridInfo.rows} × {gridInfo.cols} grid / {gridCells.length}{" "}
                  cells / {gridInfo.cellWidth}px × {gridInfo.cellHeight}px
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
                        background: "rgba(2, 6, 23, 0.55)",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        fontSize: 12,
                        color: "#cbd5e1"
                      }}
                    >
                      <strong style={{ color: "#e5e7eb" }}>{cell.id}</strong>
                      <br />
                      x:{cell.x}, y:{cell.y}
                      <br />
                      w:{cell.width}, h:{cell.height}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {zipUrl && (
              <div style={panelStyle}>
                <h3 style={{ margin: "0 0 12px" }}>Exported Assets</h3>

                <a
                  href={zipUrl}
                  download
                  style={{
                    display: "inline-block",
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
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
                  {exportedAssets.length} transparent PNG assets exported.
                </p>
              </div>
            )}

            {exportedAssets.length > 0 && (
              <div style={panelStyle}>
                <h3 style={{ margin: "0 0 12px" }}>PNG Assets</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 12
                  }}
                >
                  {exportedAssets.map((asset) => (
                    <div key={asset.id} style={checkerCardStyle}>
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
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 24,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background: "rgba(15, 23, 42, 0.72)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)"
      }}
    >
      <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>{title}</h2>
      {children}
    </section>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: 260,
        display: "grid",
        placeItems: "center",
        borderRadius: 18,
        border: "1px dashed rgba(148, 163, 184, 0.28)",
        color: "#64748b",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.55), rgba(30,41,59,0.35))"
      }}
    >
      {text}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 700
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(2, 6, 23, 0.55)",
  color: "#e5e7eb",
  outline: "none"
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.5
};

const imageStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "#020617"
};

const panelStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "rgba(15, 23, 42, 0.72)"
};

const checkerCardStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 14,
  background:
    "linear-gradient(45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.18) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0px",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};