import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Where a work came from. Kept explicit so the site never blurs fictional
 * samples or past employment into client work.
 *
 * - `client`: delivered to a paying client (shown only with their permission)
 * - `employment`: done as an employee; employer and customers stay anonymous
 * - `personal`: the owner's own project
 * - `sample`: fictional work made to demonstrate a skill; always noindexed
 */
export const workKinds = ['client', 'employment', 'personal', 'sample'] as const;

/**
 * Lifecycle of a real work. Samples have no status: their badge always says
 * they are fictional, so a sample can never look like a running service.
 */
export const workStatuses = ['active', 'completed'] as const;

/** One case study per Markdown file in `src/content/works/`. */
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z
    .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    /** Free-form period such as `2026年7月〜` or `約6年`. */
    period: z.string().min(1),
    role: z.string().min(1),
    tech: z.array(z.string().min(1)).min(1),
    kind: z.enum(workKinds),
    status: z.enum(workStatuses).optional(),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          href: z.string().min(1),
        }),
      )
      .optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    /** Lower numbers come first in lists; ties fall back to the title. */
    order: z.number().int().default(100),
  })
    // Real works must say whether they are running; samples must not.
    .refine((data) => (data.kind === 'sample') === (data.status === undefined), {
      message: '`status` is required for real works and must be omitted for `kind: sample`',
      path: ['status'],
    }),
});

export const collections = { works };
