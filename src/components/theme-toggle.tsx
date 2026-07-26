"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
export function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); return <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Ubah tema">{resolvedTheme === "dark" ? <Sun className="size-5"/> : <Moon className="size-5"/>}</Button>; }
