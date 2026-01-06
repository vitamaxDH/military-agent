import { z } from 'zod';

// Company Schema
export const CompanySchema = z.object({
    name: z.string(),
    sector: z.string(),
    location: z.string(),
    phone: z.string().optional(),
    mainProduct: z.string().optional(),
    activePersonnel: z.number().optional(),
    supplementaryPersonnel: z.number().optional(),
});

// Job Schema (Base)
export const JobSchema = z.object({
    company: z.string(),
    title: z.string(),
    link: z.string().url(),
    deadline: z.string(),
    sector: z.string(),
    source: z.enum(['saramin', 'jobkorea', 'jumpit', 'wanted']),
    salary: z.string().optional(),
    isDesignated: z.boolean().optional(),
    designatedCompanyInfo: CompanySchema.optional(),
});

// Inferred Types
export type Company = z.infer<typeof CompanySchema>;
export type Job = z.infer<typeof JobSchema>;
