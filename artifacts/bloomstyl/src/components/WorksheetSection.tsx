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
        {section.questions.map((q) => {
          const questionText =
            q.text || q.question || q.prompt || `Question ${q.number}`;

          const options = Array.isArray(q.options) ? q.options : [];

          const lowerText = String(questionText).toLowerCase();

          const isTrueFalseQuestion =
            section.type === "true_false" ||
            lowerText.startsWith("true or false") ||
            lowerText.includes("true/false") ||
            (options.length === 2 &&
              options.some((o) => String(o).toLowerCase().trim() === "true") &&
              options.some((o) => String(o).toLowerCase().trim() === "false"));

          const isMultipleChoiceQuestion =
            !isTrueFalseQuestion &&
            ((section.type === "multiple_choice" && options.length > 0) ||
              options.length === 4);

          const isExplainQuestion =
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
              key={q.number}
              className="text-base text-foreground leading-relaxed"
            >
              <div className="flex gap-2">
                <span className="font-bold min-w-[24px]">{q.number}.</span>
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