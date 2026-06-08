import { cn } from "@/Middle/Library/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";

// Add the variants configuration
export const buttonVariants = {
  variants: {
    default: "",
    destructive: "",
    outline: "",
    secondary: "",
    ghost: "",
    link: "",
  },
  sizes: {
    default: "h-10 px-5 py-2",
    sm: "h-8 px-4 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
  },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "default" | "icon";
  className?: string;
  active?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      className,
      active,
      fullWidth,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      default: "px-4 py-2 text-sm",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          // SOFT default (design-token based)
          "relative rounded-[40px] bg-card text-card-foreground border border-border/30 transition-all duration-200",
          "inline-flex items-center justify-center gap-2",
          "hover:bg-accent hover:text-accent-foreground",
          sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
          fullWidth && "w-full",
          variant === "primary" && "text-primary",
          active && "bg-accent text-accent-foreground border-border",
          // HIGH-CONTRAST override (brutalist look) — only when .high-contrast on <html>
          "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black",
          "[.high-contrast_&]:border-2 [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white",
          "[.high-contrast_&]:hover:bg-black [.high-contrast_&]:dark:hover:bg-white",
          "[.high-contrast_&]:hover:text-white [.high-contrast_&]:dark:hover:text-black",
          "[.high-contrast_&]:hover:border-white [.high-contrast_&]:dark:hover:border-black",
          // Active state: keep readable contrast (text stays its theme color), invert bg/border to match.
          active && "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black [.high-contrast_&]:text-black [.high-contrast_&]:dark:text-white [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white [.high-contrast_&]:border-4 [.high-contrast_&]:ring-2 [.high-contrast_&]:ring-black [.high-contrast_&]:dark:ring-white",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
