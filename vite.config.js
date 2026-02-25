import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// TODO: Change 'Recall' to match your GitHub repository name exactly
const REPO_NAME = "Recall"

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
})
