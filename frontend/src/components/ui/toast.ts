import { toast } from "sonner";

/**
 * Thin re-export so app code imports toast from the design system
 * rather than directly from sonner. The <Toaster /> mount lives in
 * `providers/toast-provider.tsx`.
 */
export { toast };
