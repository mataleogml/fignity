import { z } from 'zod'

export const initializeSettingsSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  figmaToken: z.string().min(1, 'Figma token is required'),
  figmaFileKey: z.string().min(1, 'Figma file key is required'),
})

export const updateSettingsSchema = z.record(z.string(), z.string())

export const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  since: z.coerce.number().optional(),
})

export const changesQuerySchema = z.object({
  since: z.coerce.number().optional(),
})

export type InitializeSettingsInput = z.infer<typeof initializeSettingsSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type ExportQueryInput = z.infer<typeof exportQuerySchema>
export type ChangesQueryInput = z.infer<typeof changesQuerySchema>
