import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva("button", {
  variants: { variant: { primary: "primary", secondary: "secondary", dark: "dark", ghost: "ghost-button", danger: "danger-button" }, size: { default: "", sm: "button-sm" } },
  defaultVariants: { variant: "primary", size: "default" },
});

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & VariantProps<typeof buttonStyles>;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />);
Button.displayName = "Button";
