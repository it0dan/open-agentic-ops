"use client";

import { useCallback, useRef, useState } from "react";
import { Grip } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function ResizableDialogContent({
  className,
  children,
  defaultWidth = 672,
  defaultHeight = 720,
  minWidth = 480,
  minHeight = 420,
  maxWidth = 960,
  maxHeight = 880,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      start.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [size],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      setSize({
        width: Math.min(maxWidth, Math.max(minWidth, start.current.w + dx)),
        height: Math.min(maxHeight, Math.max(minHeight, start.current.h + dy)),
      });
    },
    [maxWidth, maxHeight, minWidth, minHeight],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <DialogPrimitive.Content
      {...props}
      style={{ width: size.width, height: size.height }}
      className={cn(
        "fixed top-1/2 left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none",
        className,
      )}
    >
      {children}
      <div
        role="separator"
        aria-label="Redimensionar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute right-0 bottom-0 z-10 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground"
      >
        <Grip className="size-4 rotate-45" />
      </div>
    </DialogPrimitive.Content>
  );
}
