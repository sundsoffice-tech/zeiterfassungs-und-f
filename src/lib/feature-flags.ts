/**
 * Feature flags for the application
 * Controls visibility of development and experimental features
 */
export const FEATURES = {
  /**
   * Development tools visibility
   * Includes: Validation Test, Repair Mode, Performance Monitor, Lighthouse
   * Only shown in development mode
   */
  DEV_TOOLS: import.meta.env.DEV,
}
