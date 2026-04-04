import { z } from "zod"

export const locationRequirementSchema = z.object({
  label: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive(),
})

export const createTaskSchema = z.object({
  ownerId: z.string().min(1),
  agentRef: z.string().trim().optional(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  rewardAmount: z.number().positive(),
  rewardCurrency: z.string().trim().min(3).max(10).default("USD"),
  deadline: z.string().datetime(),
  proofType: z.enum(["photo", "location", "photo_location"]),
  requestCode: z.string().trim().min(4).max(32).optional(),
  locationRequirement: locationRequirementSchema.optional(),
})

export const acceptTaskSchema = z.object({
  workerId: z.string().min(1),
})

export const submitTaskSchema = z.object({
  workerId: z.string().min(1),
  submittedAt: z.string().datetime().optional(),
  requestCode: z.string().trim().min(4).max(32),
  imageDataUrl: z.string().trim().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracyMeters: z.number().nonnegative().optional(),
    })
    .optional(),
})

export const approveTaskSchema = z.object({
  approverId: z.string().min(1),
  approvalNote: z.string().trim().max(240).optional(),
})
