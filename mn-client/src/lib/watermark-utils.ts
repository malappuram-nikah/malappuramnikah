/**
 * Watermark & Canvas Image Processing Utility
 * Automatically applies an elegant "Malappuram Nikah" watermark to member photos.
 */

export async function applyWatermarkToImage(
  imageSource: string | File,
  text: string = "Malappuram Nikah"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(typeof imageSource === "string" ? imageSource : "");
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark formatting calculations
        const fontSize = Math.max(16, Math.floor(canvas.width * 0.035));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";

        // 1. Bottom Right Brand Stamp
        const padding = Math.max(14, Math.floor(canvas.width * 0.03));
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const boxHeight = fontSize * 1.8;
        const boxWidth = textWidth + padding * 1.5;
        const boxX = canvas.width - boxWidth - padding;
        const boxY = canvas.height - boxHeight - padding;

        // Semi-transparent dark pill background
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        const radius = boxHeight / 2;
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
        ctx.fill();

        // White text with shadow
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(text, boxX + padding * 0.75, boxY + boxHeight / 2);
        ctx.restore();

        // 2. Subtle center diagonal watermark pattern (transparent protection)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // 30 degree tilt
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.font = `bold ${Math.max(22, Math.floor(canvas.width * 0.05))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(text, 0, 0);
        ctx.restore();

        // Export high-quality JPEG
        const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        resolve(watermarkedDataUrl);
      } catch (err) {
        console.warn("Watermark processing failed, using original:", err);
        resolve(typeof imageSource === "string" ? imageSource : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Could not load image for watermarking:", err);
      reject(err);
    };

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(imageSource);
    }
  });
}
