import {
    getRuntimeConfig,
    RuntimeConfigError,
    type RuntimeConfig,
} from './runtimeConfig'

export interface RuntimeConfigState {
    config: RuntimeConfig | null
    error: RuntimeConfigError | null
}

export function readRuntimeConfig(): RuntimeConfigState {
    try {
        return {
            config: getRuntimeConfig(),
            error: null,
        }
    } catch (error) {
        if (error instanceof RuntimeConfigError) {
            return {
                config: null,
                error,
            }
        }

        throw error
    }
}
