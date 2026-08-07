import type { ReactNode } from "react";

type PreviewCardProps = {
  title: string;
  children: ReactNode;
};

export function PreviewCard({
  title,
  children
}: PreviewCardProps) {
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 24,
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "rgba(15, 23, 42, 0.72)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.22)"
      }}
    >
      <h2
        style={{
          margin: "0 0 14px",
          fontSize: 20
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

export function EmptyPreview({
  text
}: {
  text: string;
}) {
  return (
    <div
      style={{
        minHeight: 260,
        display: "grid",
        placeItems: "center",
        borderRadius: 18,
        border:
          "1px dashed rgba(148, 163, 184, 0.28)",
        color: "#64748b",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.55), rgba(30,41,59,0.35))"
      }}
    >
      {text}
    </div>
  );
}
