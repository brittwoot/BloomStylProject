import { useMutation } from "@tanstack/react-query";

// Simulating a file extraction endpoint that returns the parsed text from a document.
export function useUploadDocument() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Fallback for demonstration if endpoint is missing as requested in notes
        console.warn("Upload endpoint missing, mocking text extraction for demo purposes");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return `Extracted lesson text from ${file.name}. \n\nPhotosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.`;
      }

      const data = await res.json();
      return data.text as string;
    },
  });
}
