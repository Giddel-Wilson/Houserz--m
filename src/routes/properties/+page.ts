import type { PageServerLoad } from './+page.server.js';

export type PageData = Awaited<ReturnType<PageServerLoad>>;
