import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppIcon } from "./app-icons";
import { ActionButton } from "./action-button";

const meta = {
  title: "UI/Action Button",
  component: ActionButton,
  args: {
    children: "Save changes",
    tone: "primary",
    disabled: false
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["primary", "ghost", "danger"]
    }
  }
} satisfies Meta<typeof ActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Ghost: Story = {
  args: {
    children: "Secondary action",
    tone: "ghost"
  }
};

export const Danger: Story = {
  args: {
    children: "Delete track",
    tone: "danger"
  }
};

export const WithIcon: Story = {
  render: (args) => (
    <ActionButton {...args}>
      <AppIcon name="plus" />
      Create artist
    </ActionButton>
  )
};
