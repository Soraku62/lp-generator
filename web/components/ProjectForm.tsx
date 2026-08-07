import type {
  CSSProperties,
  Dispatch,
  SetStateAction
} from "react";

import { StatusDisplay } from "./StatusDisplay";

type ProjectFormProps = {
  serviceName: string;
  setServiceName: Dispatch<SetStateAction<string>>;
  concept: string;
  setConcept: Dispatch<SetStateAction<string>>;
  targetUser: string;
  setTargetUser: Dispatch<SetStateAction<string>>;
  tone: string;
  setTone: Dispatch<SetStateAction<string>>;
  mainMessage: string;
  setMainMessage: Dispatch<SetStateAction<string>>;
  loading: boolean;
  currentStep: string;
  projectId: number | null;
  error: string;
  onGenerate: () => void;
};

export function ProjectForm({
  serviceName,
  setServiceName,
  concept,
  setConcept,
  targetUser,
  setTargetUser,
  tone,
  setTone,
  mainMessage,
  setMainMessage,
  loading,
  currentStep,
  projectId,
  error,
  onGenerate
}: ProjectFormProps) {
  return (
    <div
      style={{
        padding: 22,
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius: 24,
        background: "rgba(15, 23, 42, 0.72)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.28)"
      }}
    >
      <h2 style={{ margin: "0 0 18px", fontSize: 22 }}>
        Input
      </h2>

      <div style={{ display: "grid", gap: 14 }}>
        <label style={labelStyle}>
          Service Name
          <input
            value={serviceName}
            onChange={(event) =>
              setServiceName(event.target.value)
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Concept
          <textarea
            value={concept}
            onChange={(event) =>
              setConcept(event.target.value)
            }
            rows={4}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          Target User
          <textarea
            value={targetUser}
            onChange={(event) =>
              setTargetUser(event.target.value)
            }
            rows={3}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          Tone
          <input
            value={tone}
            onChange={(event) =>
              setTone(event.target.value)
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Main Message
          <textarea
            value={mainMessage}
            onChange={(event) =>
              setMainMessage(event.target.value)
            }
            rows={3}
            style={textareaStyle}
          />
        </label>

        <button
          onClick={onGenerate}
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
            cursor: loading
              ? "not-allowed"
              : "pointer",
            boxShadow:
              "0 16px 40px rgba(59,130,246,0.35)"
          }}
        >
          {loading
            ? "Generating..."
            : "Generate LP + Asset Sheet + Export ZIP"}
        </button>

        <StatusDisplay
          currentStep={currentStep}
          projectId={projectId}
          error={error}
        />
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 700
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 12,
  border:
    "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(2, 6, 23, 0.55)",
  color: "#e5e7eb",
  outline: "none"
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.5
};
