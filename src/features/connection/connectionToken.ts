import { readApiToken } from '../../config/apiToken'

const envToken = readApiToken()

export function getCurrentToken(): string {
    return envToken
}
