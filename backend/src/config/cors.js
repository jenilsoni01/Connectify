import env from './env.js'

export const corsOptions = {
  origin: env.corsOrigin,
  credentials: true
}
