import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SelectInput } from "./select-input";

const meta = {
  title: "UI/Select Input",
  component: SelectInput,
  args: {
    options: ["Idea", "Draft", "Review", "Released"],
    defaultValue: "Draft"
  }
} satisfies Meta<typeof SelectInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
