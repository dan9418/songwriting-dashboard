import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionButton } from "./action-button";
import { useToast } from "./toast";

const meta = {
  title: "UI/Toast"
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <ActionButton onClick={() => showToast("Track saved successfully.")}>
        Show success
      </ActionButton>
      <ActionButton tone="danger" onClick={() => showToast("Unable to save track.", "error")}>
        Show error
      </ActionButton>
    </div>
  );
}

export const Playground: Story = {
  render: () => <ToastDemo />
};
