#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"

mode="${1:---update}"
case "$mode" in
  --update|--stage|--check) ;;
  *)
    printf 'Usage: %s [--update|--stage|--check]\n' "$0" >&2
    exit 2
    ;;
esac

source_url="${YE_BM83_SOURCE_URL:-https://github.com/ys4i/YE-BM83-devkit.git}"
source_ref="${YE_BM83_SOURCE_REF:-master}"
remote_paths=(
  "manual/manual.pdf"
  "manual/fig/schematic.pdf"
)
target_paths=(
  "content/projects/YE-BM83-devkit/manual/manual.pdf"
  "content/projects/YE-BM83-devkit/manual/fig/schematic.pdf"
)
revision_path="content/projects/YE-BM83-devkit/manual/source-commit.txt"

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/ye-bm83-manual-sync.XXXXXX")"
trap 'rm -rf -- "$tmpdir"' EXIT

if ! git clone --quiet --depth=1 --filter=blob:none --no-checkout \
  --branch "$source_ref" "$source_url" "$tmpdir/source"; then
  printf 'Could not fetch YE-BM83-devkit from %s (%s).\n' "$source_url" "$source_ref" >&2
  exit 1
fi

source_commit="$(git -C "$tmpdir/source" rev-parse --verify 'HEAD^{commit}')"
source_files=(
  "$tmpdir/manual.pdf"
  "$tmpdir/schematic.pdf"
)

for index in "${!remote_paths[@]}"; do
  if ! git -C "$tmpdir/source" show "HEAD:${remote_paths[$index]}" > "${source_files[$index]}"; then
    printf 'Required upstream file is missing: %s\n' "${remote_paths[$index]}" >&2
    exit 1
  fi
  if [[ "$(LC_ALL=C head -c 5 "${source_files[$index]}")" != '%PDF-' ]]; then
    printf 'Upstream file is not a PDF: %s\n' "${remote_paths[$index]}" >&2
    exit 1
  fi
done

outdated=()
for index in "${!target_paths[@]}"; do
  target="$repo_root/${target_paths[$index]}"
  if [[ ! -f "$target" ]] || ! cmp -s "${source_files[$index]}" "$target"; then
    outdated+=("${target_paths[$index]}")
  fi
done

if [[ "$mode" == "--check" ]]; then
  if (( ${#outdated[@]} > 0 )); then
    printf 'YE-BM83 PDFs are out of date:\n' >&2
    printf '  %s\n' "${outdated[@]}" >&2
    printf 'Run scripts/sync-ye-bm83-manual.sh before committing.\n' >&2
    exit 1
  fi
  printf 'YE-BM83 PDFs match upstream commit %s.\n' "$source_commit"
  exit 0
fi

revision_file="$repo_root/$revision_path"
revision_changed=1
if [[ -f "$revision_file" ]] && [[ "$(<"$revision_file")" == "$source_commit" ]]; then
  revision_changed=0
fi

if (( ${#outdated[@]} == 0 && revision_changed == 0 )); then
  printf 'YE-BM83 PDFs are already synchronized at %s.\n' "$source_commit"
  exit 0
fi

for index in "${!target_paths[@]}"; do
  target="$repo_root/${target_paths[$index]}"
  mkdir -p "$(dirname -- "$target")"
  install -m 0644 "${source_files[$index]}" "$target"
done

mkdir -p "$(dirname -- "$revision_file")"
printf '%s\n' "$source_commit" > "$tmpdir/source-commit.txt"
install -m 0644 "$tmpdir/source-commit.txt" "$revision_file"

if [[ "$mode" == "--stage" ]]; then
  git -C "$repo_root" add -- "${target_paths[@]}" "$revision_path"
  printf 'Fetched upstream commit %s and staged the YE-BM83 PDFs.\n' "$source_commit"
else
  printf 'Updated the YE-BM83 PDFs from upstream commit %s (not staged).\n' "$source_commit"
fi
