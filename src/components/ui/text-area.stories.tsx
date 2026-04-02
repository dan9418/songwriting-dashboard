import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextArea } from "./text-area";

const meta = {
  title: "UI/Text Area",
  component: TextArea,
  args: {
    rows: 5,
    defaultValue: "Focus the second verse on the pre-chorus melody."
  }
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
