import { useMutation } from "@tanstack/react-query";

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/worksheet/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to extract text from file");
      }

      const data = await res.json();
      return data.text as string;
    },
  });
}
