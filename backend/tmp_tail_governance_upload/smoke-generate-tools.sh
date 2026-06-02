#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
TOKEN="${TOKEN:-}"

if [ -z "$TOKEN" ]; then
  TOKEN=$(node -e "import jwt from 'jsonwebtoken'; console.log(jwt.sign({ userId: 0 }, process.env.JWT_SECRET || 'test-secret-key-for-development', { issuer: 'woai-ai-backend', audience: 'woai-ai-clients', expiresIn: '10m' }))")
fi

post() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BASE_URL/api/generate/$tool" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    --data "$payload"
}

assert_ok() {
  local label="$1"
  local json="$2"
  JSON_PAYLOAD="$json" node -e "const data = JSON.parse(process.env.JSON_PAYLOAD); if (data.status !== 'ok' && data.status !== 'fallback') process.exit(1); if (typeof data.degraded !== 'boolean') process.exit(1); if (!Array.isArray(data.sections)) process.exit(1);"
  printf '\n[OK] %s\n' "$label"
}

printf '\n== friend ==\n'
FRIEND_RESULT=$(post friend '{"type":"activity","scene":"奶茶店","highlight":"第二杯半价"}')
printf '%s' "$FRIEND_RESULT"
assert_ok "friend" "$FRIEND_RESULT"

printf '\n\n== topic ==\n'
TOPIC_RESULT=$(post topic '{"industry":"education","goals":["exposure","conversion"],"contentTypes":["talking","case"],"duration":"30s","scenes":["store"],"platforms":["douyin"],"count":5}')
printf '%s' "$TOPIC_RESULT"
assert_ok "topic" "$TOPIC_RESULT"

printf '\n\n== festival ==\n'
FESTIVAL_RESULT=$(post festival '{"festival":"lantern","industry":"beauty","goal":"promote","contentType":"poster"}')
printf '%s' "$FESTIVAL_RESULT"
assert_ok "festival" "$FESTIVAL_RESULT"

printf '\n\n== fission ==\n'
FISSION_RESULT=$(post fission '{"industry":"service","customerScale":"100-500","channel":"mixed","priceRange":"mid","budget":"high"}')
printf '%s' "$FISSION_RESULT"
assert_ok "fission" "$FISSION_RESULT"

printf '\n\n== marketing-plan ==\n'
MARKETING_RESULT=$(post marketing-plan '{"industry":"restaurant","goal":"提升营业额","budget":"5000","duration":"2周"}')
printf '%s' "$MARKETING_RESULT"
assert_ok "marketing-plan" "$MARKETING_RESULT"

printf '\n\n== headline ==\n'
HEADLINE_RESULT=$(post headline '{"industry":"catering","keywords":"私域,复购,到店","platform":"douyin"}')
printf '%s' "$HEADLINE_RESULT"
assert_ok "headline" "$HEADLINE_RESULT"

printf '\n\n== hook ==\n'
HOOK_RESULT=$(post hook '{"industry":"beauty","topic":"提升到店预约率"}')
printf '%s' "$HOOK_RESULT"
assert_ok "hook" "$HOOK_RESULT"

printf '\n\n== script ==\n'
SCRIPT_RESULT=$(post script '{"industry":"education","videoType":"案例分享","topic":"老学员续费转化"}')
printf '%s' "$SCRIPT_RESULT"
assert_ok "script" "$SCRIPT_RESULT"

printf '\n'
