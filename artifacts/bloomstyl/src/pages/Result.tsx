import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useWorksheetStore } from "../store";
import { WorksheetSectionRenderer } from "../components/WorksheetSection";
import { Printer, ArrowLeft } from "lucide-react";

export function Result() {
  const [_, setLocation] = useLocation();
  const { worksheet, clearWorksheet } = useWorksheetStore();

  useEffect(() => {
    // If no worksheet data is found (e.g. direct load or refresh), go back home
    if (!worksheet) {
      setLocation("/");
    }
  }, [worksheet, setLocation]);

  if (!worksheet) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    clearWorksheet();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 sm:py-10">
      
      {/* Top action bar - hidden in print */}
      <div className="print:hidden max-w-[850px] mx-auto px-4 mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-foreground font-semibold hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Generate Another
        </button>
        
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Printer className="w-5 h-5" />
          Download PDF
        </button>
      </div>

      {/* The Printable Worksheet */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[850px] mx-auto bg-white sm:rounded-xl sm:shadow-2xl shadow-black/5 p-8 sm:p-16 print:p-0 print:shadow-none"
      >
        <div className="border-b-2 border-foreground pb-8 mb-10">
          
          {/* Header row: Name and Date */}
          <div className="flex justify-between items-end mb-10 gap-8">
            <div className="flex-1 max-w-[300px]">
              <div className="text-sm font-bold text-foreground/70 uppercase tracking-widest mb-1">
                {worksheet.studentName || "Name"}
              </div>
              <div className="border-b border-foreground h-6"></div>
            </div>
            <div className="flex-1 max-w-[200px]">
              <div className="text-sm font-bold text-foreground/70 uppercase tracking-widest mb-1">
                {worksheet.date || "Date"}
              </div>
              <div className="border-b border-foreground h-6"></div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-4">
            {worksheet.title}
          </h1>
          
          <div className="flex justify-center items-center gap-3 text-foreground/80 font-medium text-lg">
            <span>{worksheet.subject}</span>
            {worksheet.gradeLevel && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                <span>{worksheet.gradeLevel}</span>
              </>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {worksheet.sections.map((section, idx) => (
            <WorksheetSectionRenderer key={idx} section={section} />
          ))}
        </div>

      </motion.div>

    </div>
  );
}
