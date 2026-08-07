"use client";

import { useState } from "react";

import { AssetSheetPreview } from "../components/AssetSheetPreview";
import { ExportPanel } from "../components/ExportPanel";
import { ExportedAssetGrid } from "../components/ExportedAssetGrid";
import { ProjectForm } from "../components/ProjectForm";
import {
  EmptyPreview,
  PreviewCard
} from "../components/PreviewCard";
import { SplitResult } from "../components/SplitResult";
import { imageStyle } from "../components/styles";
import {
  getApiErrorMessage,
  readJsonResponse
} from "../lib/api";
import type {
  AssetExportData,
  AssetSheetGenerationData,
  ExportedAsset,
  GridCell,
  GridInfo,
  GridSplitData,
  ImageGenerationData,
  ProjectCreateData
} from "../types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  const [serviceName, setServiceName] =
    useState("aiment");

  const [concept, setConcept] = useState(
    "A service where Japanese learners can practice conversation in a fun and natural way."
  );

  const [targetUser, setTargetUser] =
    useState(
      "International Japanese learners who want speaking practice."
    );

  const [tone, setTone] = useState(
    "modern, soft, futuristic, clean"
  );

  const [mainMessage, setMainMessage] =
    useState(
      "Learn Japanese by speaking, not just studying."
    );

  const [loading, setLoading] =
    useState(false);

  const [currentStep, setCurrentStep] =
    useState("");

  const [error, setError] =
    useState("");

  const [projectId, setProjectId] =
    useState<number | null>(null);

  const [lpImageUrl, setLpImageUrl] =
    useState("");

  const [
    assetSheetUrl,
    setAssetSheetUrl
  ] = useState("");

  const [gridCells, setGridCells] =
    useState<GridCell[]>([]);

  const [gridInfo, setGridInfo] =
    useState<GridInfo | null>(null);

  const [
    exportedAssets,
    setExportedAssets
  ] = useState<ExportedAsset[]>([]);

  const [zipUrl, setZipUrl] =
    useState("");

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

      /*
       * 1. プロジェクト作成
       *
       * このAPIだけは、まだトークンを
       * 持っていないため認証ヘッダー不要。
       */
      setCurrentStep(
        "1/5 Creating LP project..."
      );

      const createResponse = await fetch(
        `${API_BASE_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            serviceName,
            concept,
            targetUser,
            tone,
            mainMessage
          })
        }
      );

      const createResult =
        await readJsonResponse<ProjectCreateData>(
          createResponse
        );

      if (!createResult.success) {
        throw new Error(
          getApiErrorMessage(
            createResult,
            "Failed to create LP project."
          )
        );
      }

      const newProjectId =
        createResult.data.id;

      const projectAccessToken =
        createResult.data.accessToken;

      if (
        !Number.isInteger(newProjectId)
      ) {
        throw new Error(
          "API did not return a valid project ID."
        );
      }

      if (
        typeof projectAccessToken !==
          "string" ||
        !projectAccessToken
      ) {
        throw new Error(
          "API did not return a project access token."
        );
      }

      setProjectId(newProjectId);

      /*
       * このプロジェクト専用のヘッダー。
       *
       * lp-images
       * asset-sheets
       * asset-exports
       *
       * の3つへ毎回送る。
       */
      const projectHeaders = {
        "Content-Type":
          "application/json",
        "X-Project-Token":
          projectAccessToken
      };

      /*
       * 2. LP画像生成
       */
      setCurrentStep(
        "2/5 Generating LP image..."
      );

      const imageResponse = await fetch(
        `${API_BASE_URL}/projects/${newProjectId}/lp-images`,
        {
          method: "POST",
          headers: projectHeaders,
          body: JSON.stringify({})
        }
      );

      const imageResult =
        await readJsonResponse<ImageGenerationData>(
          imageResponse
        );

      if (!imageResult.success) {
        throw new Error(
          getApiErrorMessage(
            imageResult,
            "Failed to generate LP image."
          )
        );
      }

      const newLpImageUrl =
        imageResult.data.imageUrl;

      setLpImageUrl(newLpImageUrl);

      /*
       * 3. 素材シート生成
       */
      setCurrentStep(
        "3/5 Generating asset sheet..."
      );

      const assetSheetResponse =
        await fetch(
          `${API_BASE_URL}/projects/${newProjectId}/asset-sheets`,
          {
            method: "POST",
            headers: projectHeaders,
            body: JSON.stringify({})
          }
        );

      const assetSheetResult =
        await readJsonResponse<AssetSheetGenerationData>(
          assetSheetResponse
        );

      if (!assetSheetResult.success) {
        throw new Error(
          getApiErrorMessage(
            assetSheetResult,
            "Failed to generate asset sheet."
          )
        );
      }

      const newAssetSheetUrl =
        assetSheetResult.data
          .assetSheetUrl;

      setAssetSheetUrl(
        newAssetSheetUrl
      );

      /*
       * 4. グリッド情報を計算
       *
       * このAPIはプロジェクト固有情報を
       * 取得しないためトークン不要。
       */
      setCurrentStep(
        "4/5 Splitting asset sheet into grid cells..."
      );

      const splitResponse = await fetch(
        `${API_BASE_URL}/grid-splits`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            imageUrl:
              newAssetSheetUrl,
            imageWidth: 1024,
            imageHeight: 1024,
            rows: 4,
            cols: 4
          })
        }
      );

      const splitResult =
        await readJsonResponse<GridSplitData>(
          splitResponse
        );

      if (!splitResult.success) {
        throw new Error(
          getApiErrorMessage(
            splitResult,
            "Failed to split asset sheet."
          )
        );
      }

      setGridCells(
        splitResult.data.cells
      );

      setGridInfo(
        splitResult.data.grid
      );

      /*
       * 5. PNG素材とZIPを書き出す
       */
      setCurrentStep(
        "5/5 Exporting transparent PNG assets..."
      );

      const exportResponse = await fetch(
        `${API_BASE_URL}/projects/${newProjectId}/asset-exports`,
        {
          method: "POST",
          headers: projectHeaders,
          body: JSON.stringify({})
        }
      );

      const exportResult =
        await readJsonResponse<AssetExportData>(
          exportResponse
        );

      if (!exportResult.success) {
        throw new Error(
          getApiErrorMessage(
            exportResult,
            "Failed to export assets."
          )
        );
      }

      setExportedAssets(
        exportResult.data.assets
      );

      setZipUrl(
        exportResult.data.zipUrl
      );

      setCurrentStep("Done");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong."
        );
      }

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
              border:
                "1px solid rgba(125, 211, 252, 0.35)",
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
              fontSize:
                "clamp(36px, 6vw, 72px)",
              letterSpacing: "-0.06em",
              lineHeight: 0.95
            }}
          >
            Generate. Assetize. Split.
            Export.
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
            Generate a landing page
            image, recreate it as an
            asset sheet, split the sheet
            into grid-based cells, export
            transparent PNG assets, and
            download them as a ZIP.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(300px, 420px) 1fr",
            gap: 24,
            alignItems: "start"
          }}
        >
          <ProjectForm
            serviceName={serviceName}
            setServiceName={setServiceName}
            concept={concept}
            setConcept={setConcept}
            targetUser={targetUser}
            setTargetUser={setTargetUser}
            tone={tone}
            setTone={setTone}
            mainMessage={mainMessage}
            setMainMessage={setMainMessage}
            loading={loading}
            currentStep={currentStep}
            projectId={projectId}
            error={error}
            onGenerate={handleGenerateAll}
          />

          <div
            style={{
              display: "grid",
              gap: 24
            }}
          >
            <PreviewCard title="Landing Page Image">
              {lpImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lpImageUrl}
                  alt="Generated LP"
                  style={imageStyle}
                />
              ) : (
                <EmptyPreview text="LP image will appear here." />
              )}
            </PreviewCard>

            <AssetSheetPreview
              assetSheetUrl={assetSheetUrl}
              gridCells={gridCells}
            />

            <SplitResult
              gridInfo={gridInfo}
              gridCells={gridCells}
            />

            <ExportPanel
              zipUrl={zipUrl}
              assetCount={exportedAssets.length}
            />

            <ExportedAssetGrid
              assets={exportedAssets}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
