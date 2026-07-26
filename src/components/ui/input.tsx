import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("h-11 w-full rounded-xl border bg-[var(--card)] px-3 text-sm placeholder:text-[var(--muted-foreground)]", className)} {...props} />; }
