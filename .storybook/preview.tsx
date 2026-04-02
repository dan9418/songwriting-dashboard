import type { Preview } from "@storybook/nextjs-vite";
import "@/app/globals.css";
import { APP_THEMES, DEFAULT_THEME_ID } from "@/lib/theme/design-system";
import { StorybookProviders } from "./storybook-providers";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    nextjs: {
      appDirectory: true
    }
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Preview theme",
      toolbar: {
        icon: "paintbrush",
        items: APP_THEMES.map((theme) => ({
          value: theme.id,
          title: theme.label
        }))
      }
    }
  },
  initialGlobals: {
    theme: DEFAULT_THEME_ID
  },
  decorators: [
    (Story, context) => (
      <StorybookProviders themeId={String(context.globals.theme ?? DEFAULT_THEME_ID)}>
        <Story />
      </StorybookProviders>
    )
  ]
};

export default preview;
