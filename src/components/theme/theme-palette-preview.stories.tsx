import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemePalettePreview } from "./theme-palette-preview";

const meta = {
  title: "Theme/Palette Preview",
  component: ThemePalettePreview,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof ThemePalettePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
