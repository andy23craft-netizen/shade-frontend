#!/bin/sh
set -eu

CONFIG_PATH='/usr/share/nginx/html/config.js'

api_base_url="${SHADE_API_BASE_URL:-http://127.0.0.1:8000}"
diagnostics_enabled="${SHADE_DIAGNOSTICS_ENABLED:-false}"
diagnostics_endpoint="${SHADE_DIAGNOSTICS_ENDPOINT:-}"

case "$diagnostics_enabled" in
    true|false)
        ;;
    *)
        echo >&2 'SHADE_DIAGNOSTICS_ENABLED must be "true" or "false".'
        exit 1
        ;;
esac

escape_js_string() {
    printf '%s' "$1" \
        | sed \
            -e 's/\\/\\\\/g' \
            -e 's/"/\\"/g'
}

escaped_api_base_url="$(escape_js_string "$api_base_url")"

if [ -n "$diagnostics_endpoint" ]; then
    escaped_diagnostics_endpoint="$(escape_js_string "$diagnostics_endpoint")"
    diagnostics_endpoint_value="\"${escaped_diagnostics_endpoint}\""
else
    diagnostics_endpoint_value='null'
fi

cat > "$CONFIG_PATH" <<EOF_CONFIG
window.__SHADE_CONFIG__ = {
    apiBaseUrl: "${escaped_api_base_url}",
    diagnostics: {
        enabled: ${diagnostics_enabled},
        endpoint: ${diagnostics_endpoint_value},
    },
}
EOF_CONFIG
