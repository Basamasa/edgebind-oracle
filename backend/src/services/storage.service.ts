import { AppError } from "../middleware/error.middleware"

class StorageService {
  persistProofImage(imageDataUrl?: string | null) {
    if (!imageDataUrl) {
      return null
    }

    if (
      !imageDataUrl.startsWith("data:image/") &&
      !imageDataUrl.startsWith("http://") &&
      !imageDataUrl.startsWith("https://") &&
      !imageDataUrl.startsWith("demo://")
    ) {
      throw new AppError(400, "Proof image must be a valid image data URL or URL")
    }

    return imageDataUrl
  }
}

export const storageService = new StorageService()
