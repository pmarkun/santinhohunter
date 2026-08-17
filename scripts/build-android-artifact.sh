#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="apk"
ARCH="${ANDROID_ARCH:-arm64-v8a}"
API_URL="${EXPO_PUBLIC_SANTINHO_API_BASE_URL:-https://santinho-api-production.up.railway.app}"
EAS_PROFILE="${EAS_BUILD_PROFILE:-production}"
INSTALL_APK="false"
ADB_SERIAL="${ADB_SERIAL:-}"

usage() {
  cat <<'EOF'
Usage:
  scripts/build-android-artifact.sh [apk|aab|both] [options]

Options:
  --arch <abi>       Native ABI for local APK builds. Default: arm64-v8a
  --api-url <url>    API base URL embedded in the app.
  --profile <name>   EAS profile for AAB builds. Default: production
  --install          Install the APK with adb after a local APK build.
  --serial <id>      adb device serial used with --install.
  -h, --help         Show this help.

Examples:
  scripts/build-android-artifact.sh apk --install --serial RQCW702390V
  scripts/build-android-artifact.sh aab
  scripts/build-android-artifact.sh both --arch arm64-v8a
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    apk|aab|both)
      MODE="$1"
      shift
      ;;
    --arch)
      ARCH="${2:?Missing value for --arch}"
      shift 2
      ;;
    --api-url)
      API_URL="${2:?Missing value for --api-url}"
      shift 2
      ;;
    --profile)
      EAS_PROFILE="${2:?Missing value for --profile}"
      shift 2
      ;;
    --install)
      INSTALL_APK="true"
      shift
      ;;
    --serial)
      ADB_SERIAL="${2:?Missing value for --serial}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

step_index=0
step() {
  step_index=$((step_index + 1))
  printf '\n[%s] step %02d: %s\n' "$(date '+%H:%M:%S')" "$step_index" "$*"
}

read_app_field() {
  node -e "const app=require('./app.json').expo; console.log($1)"
}

APP_NAME="$(read_app_field 'app.slug')"
APP_VERSION="$(read_app_field 'app.version')"
VERSION_CODE="$(read_app_field 'app.android.versionCode')"
PACKAGE_NAME="$(read_app_field 'app.android.package')"
GIT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
GIT_SHORT="$(git -C "$ROOT" rev-parse --short HEAD)"

mkdir -p "$ROOT/dist/android" "$ROOT/dist/playstore"

print_context() {
  step "Build context"
  echo "root: $ROOT"
  echo "mode: $MODE"
  echo "app: $APP_NAME"
  echo "package: $PACKAGE_NAME"
  echo "version: $APP_VERSION"
  echo "versionCode: $VERSION_CODE"
  echo "git: $GIT_SHORT"
  echo "api: $API_URL"
}

build_apk() {
  local output="$ROOT/dist/android/${APP_NAME}-${APP_VERSION}-vc${VERSION_CODE}-${ARCH}-release.apk"

  step "Building local APK with Gradle ($ARCH)"
  EXPO_PUBLIC_SANTINHO_API_BASE_URL="$API_URL" \
    ANDROID_HOME="${ANDROID_HOME:-/home/markun/Android/Sdk}" \
    ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/home/markun/Android/Sdk}" \
    nix shell nixpkgs#jdk17 nixpkgs#nodejs_24 -c bash -lc \
      "cd '$ROOT/android' && ./gradlew --console=plain assembleRelease -PreactNativeArchitectures='$ARCH'"

  step "Copying APK artifact"
  cp "$ROOT/android/app/build/outputs/apk/release/app-release.apk" "$output"
  ls -lh "$output"
  sha256sum "$output"

  if [[ "$INSTALL_APK" == "true" ]]; then
    step "Installing APK with adb"
    if [[ -n "$ADB_SERIAL" ]]; then
      adb -s "$ADB_SERIAL" install -r "$output"
    else
      adb install -r "$output"
    fi
  fi
}

write_latest_eas_metadata() {
  local out_env="$1"
  local builds_json="$2"

  node - "$builds_json" "$out_env" "$GIT_SHA" "$APP_VERSION" "$VERSION_CODE" <<'NODE'
const fs = require('fs');
const [jsonPath, outEnv, gitSha, appVersion, versionCode] = process.argv.slice(2);
const builds = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const build = builds.find((candidate) =>
  candidate.platform === 'ANDROID' &&
  candidate.distribution === 'STORE' &&
  candidate.status === 'FINISHED' &&
  candidate.gitCommitHash === gitSha &&
  candidate.appVersion === appVersion &&
  String(candidate.appBuildVersion) === String(versionCode) &&
  candidate.artifacts?.applicationArchiveUrl
);

if (!build) {
  console.error('No finished AAB artifact found for the current git/version context.');
  process.exit(1);
}

fs.writeFileSync(outEnv, [
  `EAS_BUILD_ID=${build.id}`,
  `EAS_AAB_URL=${build.artifacts.applicationArchiveUrl}`,
  '',
].join('\n'));
NODE
}

build_aab() {
  local builds_json
  local env_file
  local output="$ROOT/dist/playstore/${APP_NAME}-${APP_VERSION}-vc${VERSION_CODE}-${GIT_SHORT}.aab"

  builds_json="$(mktemp)"
  env_file="$(mktemp)"

  step "Building Play Store AAB with EAS ($EAS_PROFILE)"
  EXPO_PUBLIC_SANTINHO_API_BASE_URL="$API_URL" \
    nix develop --command npx eas-cli build \
      --platform android \
      --profile "$EAS_PROFILE" \
      --non-interactive

  step "Resolving EAS artifact URL"
  nix develop --command npx eas-cli build:list --platform android --limit 10 --json > "$builds_json"
  write_latest_eas_metadata "$env_file" "$builds_json"
  # shellcheck disable=SC1090
  source "$env_file"

  echo "EAS build: $EAS_BUILD_ID"
  echo "AAB URL: $EAS_AAB_URL"

  step "Downloading AAB artifact"
  curl -L "$EAS_AAB_URL" -o "$output"
  ls -lh "$output"
  sha256sum "$output"
}

cd "$ROOT"
print_context

case "$MODE" in
  apk)
    build_apk
    ;;
  aab)
    build_aab
    ;;
  both)
    build_apk
    build_aab
    ;;
esac

step "Done"
