import React from "react";
import type { WorksheetSection as SectionType } from "@workspace/api-client-react";

export function WorksheetSectionRenderer({
  section,
}: {
  section: SectionType;
}) {
  return (
    <div className="mb-10 print-break-inside-avoid">
      <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center justify-between">
        {section.title}
        {section.points && (
          <span className="text-sm font-sans font-normal text-muted-foreground">
            ({section.points} points)
          </span>
        )}
      </h3>

      {section.instructions && (
        <p className="text-sm italic text-foreground/80 mb-6 pb-2 border-b border-border/50">
          {section.instructions}
        </p>
      )}

      <div className="space-y-6">
        {section.questions.map((q, index) => {
          const questionText =
            q.text || q.question || q.prompt || `Question ${q.number ?? index + 1}`;

          // Support both legacy "options" and new "choices"
          const rawOptions = Array.isArray(q.options)
            ? q.options
            : Array.isArray(q.choices)
              ? q.choices
              : [];

          // Respect teacher-controlled display count if present
          const displayChoiceCount =
            typeof q.display_choice_count === "number" && q.display_choice_count > 0
              ? q.display_choice_count
              : rawOptions.length;

          const options = rawOptions.slice(0, displayChoiceCount);

          const lowerText = String(questionText).toLowerCase();

          const isTrueFalseQuestion =
            q.question_type === "true_false" ||
            section.type === "true_false" ||
            lowerText.startsWith("true or false") ||
            lowerText.includes("true/false") ||
            (rawOptions.length === 2 &&
              rawOptions.some((o) => String(o).toLowerCase().trim() === "true") &&
              rawOptions.some((o) => String(o).toLowerCase().trim() === "false"));

          const isMultipleChoiceQuestion =
            !isTrueFalseQuestion &&
            (
              q.question_type === "multiple_choice" ||
              section.type === "multiple_choice" ||
              options.length >= 2
            );

          const isExplainQuestion =
            q.question_type === "extended_response" ||
            section.type === "explain" ||
            section.type === "essay" ||
            lowerText.includes("explain why") ||
            lowerText.startsWith("explain") ||
            lowerText.includes("support your answer") ||
            lowerText.includes("why do you think");

          const isShortAnswerQuestion =
            !isMultipleChoiceQuestion &&
            !isTrueFalseQuestion &&
            !isExplainQuestion;

          return (
            <div
              key={q.id ?? q.number ?? index}
              className="text-base text-foreground leading-relaxed"
            >
              <div className="flex gap-2">
                <span className="font-bold min-w-[24px]">
                  {q.number ?? index + 1}.
                </span>
                <div className="flex-1">
                  <p className="mb-2 font-medium">{questionText}</p>

                  {isMultipleChoiceQuestion && options.length > 0 && (
                    <div className="mt-3 ml-2 space-y-2">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-sm font-semibold shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="pt-0.5">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isTrueFalseQuestion && (
                    <div className="mt-3 flex gap-8 ml-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-border"></div>
                        <span className="font-medium">True</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-border"></div>
                        <span className="font-medium">False</span>
                      </div>
                    </div>
                  )}

                  {(isShortAnswerQuestion || isExplainQuestion) && (
                    <div className="mt-6 space-y-8">
                      {Array.from({
                        length: q.lines || (isExplainQuestion ? 5 : 2),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="w-full border-b border-foreground/30 h-4"
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}