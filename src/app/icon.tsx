import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/ui/app-icons";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "16px",
          background: "linear-gradient(160deg, #d8e3ff 0%, #eef2f7 60%, #dff2ea 100%)",
          color: "#39558f"
        }}
      >
        <AppIcon name="note" width={40} height={40} strokeWidth={1.9} />
      </div>
    ),
    size
  );
}
