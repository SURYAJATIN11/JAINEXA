/**
 * ocrScanner.ts
 *
 * Client-side OCR engine using Tesseract.js to extract student roster text,
 * USNs, roll numbers, and student names from uploaded images, photos, and screenshots.
 */

export interface OCRProgress {
  progress: number;
  status: string;
}

export async function extractTextFromImage(
  imageSource: string | File | Blob,
  onProgress?: (info: OCRProgress) => void
): Promise<{ success: boolean; text: string; error?: string }> {
  try {
    onProgress?.({ progress: 10, status: "Initializing OCR scanner..." });

    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          const pct = Math.round(m.progress * 100);
          onProgress?.({ progress: Math.min(95, Math.max(15, pct)), status: `Scanning student list... ${pct}%` });
        } else if (m.status) {
          onProgress?.({ progress: 30, status: `${m.status}...` });
        }
      }
    });

    onProgress?.({ progress: 50, status: "Extracting text and tables..." });

    const result = await worker.recognize(imageSource);
    await worker.terminate();

    const rawText = result?.data?.text || "";
    onProgress?.({ progress: 100, status: "Complete" });

    return {
      success: true,
      text: rawText
    };
  } catch (error: any) {
    console.error("OCR Scanner Error:", error);
    return {
      success: false,
      text: "",
      error: error?.message || "Could not read text from this image."
    };
  }
}
