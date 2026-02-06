// Use server-side auth config with Firebase adapter (Node.js runtime)
import { authServer } from "@/lib/auth-server"

export const { GET, POST } = authServer.handlers
