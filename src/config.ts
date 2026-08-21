import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-speed-type",
  description: "A shared, peer-to-peer typing sprint with a live WPM leaderboard.",
  accentHex: "#38bdf8",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
