/**
 * Utility functions for working with environment variables
 */

// Check if an environment variable exists and has a value
export function hasEnvVariable(name: string): boolean {
  const value = process.env[name]
  return !!value && value.trim() !== ""
}

// Get an environment variable with a fallback
export function getEnvVariable(name: string, fallback = ""): string {
  const value = process.env[name]
  return value && value.trim() !== "" ? value.trim() : fallback
}

// Log environment variable status (safely)
export function logEnvVariableStatus(name: string): void {
  const exists = hasEnvVariable(name)
  const value = getEnvVariable(name)

  if (exists) {
    const maskedValue = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : "****"

    console.log(`Environment variable ${name} is set (length: ${value.length}, format: ${maskedValue})`)
  } else {
    console.warn(`Environment variable ${name} is not set or empty`)
  }
}
