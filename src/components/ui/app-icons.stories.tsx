import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppIcon, type AppIconName } from "./app-icons";

const iconNames = [
  "home",
  "artist",
  "project",
  "track",
  "admin",
  "plus",
  "note",
  "notebook",
  "pencil",
  "trash"
] satisfies AppIconName[];

const meta = {
  title: "UI/App Icons",
  component: AppIcon,
  args: {
    name: "home"
  },
  parameters: {
    controls: { disable: true }
  }
} satisfies Meta<typeof AppIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {iconNames.map((iconName) => (
        <div
          key={iconName}
          className="panel flex flex-col items-center gap-3 px-4 py-5 text-center"
        >
          <span className="theme-icon-frame h-12 w-12">
            <AppIcon name={iconName} className="h-6 w-6" />
          </span>
          <span className="text-sm font-medium capitalize text-[color:var(--ink)]">
            {iconName}
          </span>
        </div>
      ))}
    </div>
  )
};
