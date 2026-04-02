import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PillInput } from "./pill-input";

const meta = {
  title: "UI/Pill Input",
  component: PillInput,
  args: {
    placeholder: "chorus, upbeat, demo"
  }
} satisfies Meta<typeof PillInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function PillInputDemo(args: Story["args"]) {
  const [value, setValue] = useState(["chorus", "upbeat", "demo"]);

  return (
    <div className="grid max-w-xl gap-3">
      <PillInput {...args} value={value} onChange={setValue} />
      <p className="text-sm text-[color:var(--muted)]">Parsed values: {value.join(" | ")}</p>
    </div>
  );
}

export const Default: Story = {
  args: {
    value: [],
    onChange: () => undefined
  },
  render: (args) => <PillInputDemo {...args} />
};
