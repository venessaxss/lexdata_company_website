import type { Metadata } from "next";
import MedQuizHero from "@/components/medquiz/MedQuizHero";
import "./medquiz.css";

export const metadata: Metadata = {
  title: "MedQuiz | Offline Medical MCQ App | LexData",
  description:
    "MedQuiz is an upcoming Android app for offline medical MCQ practice: 10,012 MCQs with explanations, progress statistics and daily study reminders.",
};

export default function MedQuizPage() {
  return (
    <main className="mqp-page">
      <MedQuizHero />

      {/* Step 3: features section (id="features")  */}
      {/* Step 4: screenshots gallery               */}
      {/* Step 5: stats, FAQ and final call to action */}
    </main>
  );
}