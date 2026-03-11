import React from "react";
import { Link } from "wouter";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-primary/10 p-6 rounded-full text-primary mb-6">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-display font-bold text-foreground mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground max-w-md text-center mb-8">
        Looks like this page got misplaced in the lesson plan. Let's get you back to creating worksheets.
      </p>
      <Link href="/" className="px-6 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
        Return Home
      </Link>
    </div>
  );
}
