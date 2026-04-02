"use client";

import type { TextareaHTMLAttributes } from "react";

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`theme-input ring-0 ${props.className ?? ""}`}
    />
  );
}
