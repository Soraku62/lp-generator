type StatusDisplayProps = {
  currentStep: string;
  projectId: number | null;
  error: string;
};

export function StatusDisplay({
  currentStep,
  projectId,
  error
}: StatusDisplayProps) {
  return (
    <>
      {currentStep && (
        <p
          style={{
            margin: "4px 0 0",
            color:
              currentStep === "Failed"
                ? "#fca5a5"
                : "#7dd3fc",
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
            background:
              "rgba(127, 29, 29, 0.35)",
            color: "#fecaca",
            fontSize: 12,
            lineHeight: 1.5
          }}
        >
          {error}
        </pre>
      )}
    </>
  );
}
