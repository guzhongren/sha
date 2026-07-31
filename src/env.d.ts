declare module "virtual:blog-theme/config" {
  import type { NormalizedBlogThemeOptions } from "./types";

  const config: NormalizedBlogThemeOptions;
  export { config };
  export default config;
}
