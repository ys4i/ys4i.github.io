#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hook_path="$repo_root/.githooks"

if [[ ! -x "$hook_path/pre-commit" ]]; then
  printf 'Pre-commit hook is missing or not executable: %s/pre-commit\n' "$hook_path" >&2
  exit 1
fi

git -C "$repo_root" config --local core.hooksPath .githooks
printf 'Git hooks enabled for this checkout: %s\n' "$hook_path"
