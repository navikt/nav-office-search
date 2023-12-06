// ../vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/terje/Dev/nav-office-search/node_modules/vite/dist/node/index.js";
import preact from "file:///Users/terje/Dev/nav-office-search/node_modules/@preact/preset-vite/dist/esm/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    plugins: [preact()],
    esbuild: {
      legalComments: "none"
    },
    ssr: {
      // React modules from node_modules must not be externalized
      // in order to work with preact/compat
      noExternal: [
        "@navikt/ds-react",
        "@navikt/ds-icons",
        "@navikt/aksel-icons"
      ]
    },
    base: process.env.VITE_APP_BASEPATH
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGVyamUvRGV2L25hdi1vZmZpY2Utc2VhcmNoXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdGVyamUvRGV2L25hdi1vZmZpY2Utc2VhcmNoL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90ZXJqZS9EZXYvbmF2LW9mZmljZS1zZWFyY2gvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCBwcmVhY3QgZnJvbSAnQHByZWFjdC9wcmVzZXQtdml0ZSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gICAgcHJvY2Vzcy5lbnYgPSB7IC4uLnByb2Nlc3MuZW52LCAuLi5sb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBwbHVnaW5zOiBbcHJlYWN0KCldLFxuICAgICAgICBlc2J1aWxkOiB7XG4gICAgICAgICAgICBsZWdhbENvbW1lbnRzOiAnbm9uZScsXG4gICAgICAgIH0sXG4gICAgICAgIHNzcjoge1xuICAgICAgICAgICAgLy8gUmVhY3QgbW9kdWxlcyBmcm9tIG5vZGVfbW9kdWxlcyBtdXN0IG5vdCBiZSBleHRlcm5hbGl6ZWRcbiAgICAgICAgICAgIC8vIGluIG9yZGVyIHRvIHdvcmsgd2l0aCBwcmVhY3QvY29tcGF0XG4gICAgICAgICAgICBub0V4dGVybmFsOiBbXG4gICAgICAgICAgICAgICAgJ0BuYXZpa3QvZHMtcmVhY3QnLFxuICAgICAgICAgICAgICAgICdAbmF2aWt0L2RzLWljb25zJyxcbiAgICAgICAgICAgICAgICAnQG5hdmlrdC9ha3NlbC1pY29ucycsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBiYXNlOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9CQVNFUEFUSCxcbiAgICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdSLFNBQVMsY0FBYyxlQUFlO0FBQzlULE9BQU8sWUFBWTtBQUduQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN0QyxVQUFRLE1BQU0sRUFBRSxHQUFHLFFBQVEsS0FBSyxHQUFHLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQyxFQUFFO0FBRWhFLFNBQU87QUFBQSxJQUNILFNBQVMsQ0FBQyxPQUFPLENBQUM7QUFBQSxJQUNsQixTQUFTO0FBQUEsTUFDTCxlQUFlO0FBQUEsSUFDbkI7QUFBQSxJQUNBLEtBQUs7QUFBQTtBQUFBO0FBQUEsTUFHRCxZQUFZO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxJQUNBLE1BQU0sUUFBUSxJQUFJO0FBQUEsRUFDdEI7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
