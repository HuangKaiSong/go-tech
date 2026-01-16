
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@go-tech-frontend/lib";
import { useIframeContext } from "@/contexts/IframeContext";

const buttonVariants = cva(
  "inline-flex items-center justify-center shrink-0 select-none align-top text-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const { hasIframe } = useIframeContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // 如果在 iframe 中且没有被显式禁用，则阻止点击
      if (hasIframe && !props.disabled) {
        e.preventDefault();
        console.warn('在 iframe 中按钮点击被阻止');
        return;
      }
      
      // 如果有原始的 onClick 处理程序，则调用它
      if (onClick) {
        onClick(e);
      }
    };
    
    const Comp = asChild ? Slot : "button";
    const isActuallyDisabled = props.disabled || hasIframe; // 如果在 iframe 中则禁用按钮

    return <Comp 
      disabled={isActuallyDisabled}
      data-accent-color={props.color}
      data-disabled={isActuallyDisabled || undefined}
      data-iframe={hasIframe} // 添加 iframe 状态数据属性用于样式
      className={cn(
        buttonVariants({ variant, size, className }),
        hasIframe ? "cursor-not-allowed opacity-60" : "" // 如果在 iframe 中添加视觉提示
      )}
      ref={ref}
      onClick={handleClick}
      {...props}
    />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
