import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./field";
import { TextInput } from "./text-input";

const meta = {
  title: "UI/Field",
  component: Field
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Track title",
    children: <TextInput placeholder="Midnight chorus" />
  }
};
