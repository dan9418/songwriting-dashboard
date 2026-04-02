import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextInput } from "./text-input";

const meta = {
  title: "UI/Text Input",
  component: TextInput,
  args: {
    placeholder: "Midnight chorus"
  }
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "Neon bridge"
  }
};
