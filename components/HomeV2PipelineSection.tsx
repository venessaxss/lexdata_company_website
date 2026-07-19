"use client";

import type { CSSProperties } from "react";
import { Pipeline } from "@/components/motion2";

const stages = [
  {
    step: "01",
    title: "Corpus",
    body: "We gather and structure language data — documents, translations, classroom texts, transcripts, and research materials — into usable datasets.",
  },
  {
    step: "02",
    title: "Annotation",
    body: "We help researchers label, organize, and interpret language data with transparent and reusable workflows.",
  },
  {
    step: "03",
    title: "Model",
    body: "We connect corpus methods, NLP, AI tools, and data science techniques to real research and teaching tasks.",
  },
  {
    step: "04",
    title: "Insight",
    body: "We turn data into publishable findings, better teaching materials, stronger translation workflows, and practical research output.",
  },
];

export default function HomeV2PipelineSection() {
  return (
    <Pipeline heightVh={260}>
      {(progress, active) => (
        <div className="lx2-container">
          <div className="lx2-pipeline-head">
            <span className="lx2-label">Our method</span>

            <h2>
              One arc, every project:{" "}
              <span className="lx2-serif-accent">corpus to insight</span>.
            </h2>
          </div>

          <div className="lx2-stages">
            <div
              className="lx2-track-fill"
              style={{ "--lx2-p": progress } as CSSProperties}
            />

            {stages.map((stage, index) => (
              <div
                key={stage.step}
                data-step={stage.step}
                className={`lx2-stage ${index <= active ? "is-active" : ""}`}
              >
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Pipeline>
  );
}