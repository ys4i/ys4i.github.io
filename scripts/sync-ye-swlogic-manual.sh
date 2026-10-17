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

source_url="${YE_SWLOGIC_SOURCE_URL:-git@github.com:ys4i/YE-SWlogic.git}"
source_ref="${YE_SWLOGIC_SOURCE_REF:-main}"
local_source="${YE_SWLOGIC_SOURCE_DIR:-$repo_root/../YE-SWlogic}"
remote_paths=(
  "manual/manual.pdf"
  "manual/fig/schematic_and.pdf"
  "manual/fig/schematic_or.pdf"
)
target_paths=(
  "content/projects/YE-SWlogic/manual/manual.pdf"
  "content/projects/YE-SWlogic/manual/fig/schematic_and.pdf"
  "content/projects/YE-SWlogic/manual/fig/schematic_or.pdf"
)
revision_path="content/projects/YE-SWlogic/manual/source-commit.txt"

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/ye-swlogic-manual-sync.XXXXXX")"
trap 'rm -rf -- "$tmpdir"' EXIT

if ! git clone --quiet --depth=1 --filter=blob:none --no-checkout \
  --branch "$source_ref" "$source_url" "$tmpdir/source"; then
  printf 'Could not fetch YE-SWlogic from %s (%s).\n' "$source_url" "$source_ref" >&2
  exit 1
fi

source_commit="$(git -C "$tmpdir/source" rev-parse --verify 'HEAD^{commit}')"
source_files=()
remote_complete=1
for index in "${!remote_paths[@]}"; do
  source_file="$tmpdir/source-${index}.pdf"
  if ! git -C "$tmpdir/source" show "HEAD:${remote_paths[$index]}" > "$source_file" 2>/dev/null; then
    remote_complete=0
    break
  fi
  source_files+=("$source_file")
done

revision_contents="$source_commit"
source_label="upstream commit"
if (( remote_complete == 0 )); then
  # Until the PDFs are committed upstream, use the matching local checkout's
  # generated PDFs. Requiring the same HEAD avoids silently syncing stale files.
  local_commit=""
  if [[ -d "$local_source/.git" || -f "$local_source/.git" ]]; then
    local_commit="$(git -C "$local_source" rev-parse --verify 'HEAD^{commit}' 2>/dev/null || true)"
  fi
  if [[ -z "$local_commit" || "$local_commit" != "$source_commit" ]]; then
    printf 'The upstream commit %s does not contain all required PDFs, and no matching local checkout is available.\n' "$source_commit" >&2
    printf 'Make the PDFs available in the source repository, or set YE_SWLOGIC_SOURCE_DIR to the matching checkout.\n' >&2
    exit 1
  fi

  source_files=()
  for remote_path in "${remote_paths[@]}"; do
    local_file="$local_source/$remote_path"
    if [[ ! -f "$local_file" ]]; then
      printf 'Required local source file is missing: %s\n' "$local_file" >&2
      exit 1
    fi
    source_files+=("$local_file")
  done
  revision_contents+=$'\nLOCAL WORKTREE EXPORTS: PDFs are not included in this Git commit.'
  source_label="matching local checkout (PDFs not yet committed upstream)"
fi

for index in "${!source_files[@]}"; do
  if [[ "$(LC_ALL=C head -c 5 "${source_files[$index]}")" != '%PDF-' ]]; then
    printf 'Source file is not a PDF: %s\n' "${remote_paths[$index]}" >&2
    exit 1
  fi
done

revision_file="$tmpdir/source-commit.txt"
printf '%s\n' "$revision_contents" > "$revision_file"

outdated=()
for index in "${!target_paths[@]}"; do
  target="$repo_root/${target_paths[$index]}"
  if [[ ! -f "$target" ]] || ! cmp -s "${source_files[$index]}" "$target"; then
    outdated+=("${target_paths[$index]}")
  fi
done

target_revision="$repo_root/$revision_path"
if [[ ! -f "$target_revision" ]] || ! cmp -s "$revision_file" "$target_revision"; then
  revision_changed=1
else
  revision_changed=0
fi

if [[ "$mode" == "--check" ]]; then
  if (( ${#outdated[@]} > 0 || revision_changed > 0 )); then
    printf 'YE-SWlogic PDFs are out of date:\n' >&2
    if (( ${#outdated[@]} > 0 )); then
      printf '  %s\n' "${outdated[@]}" >&2
    fi
    if (( revision_changed > 0 )); then
      printf '  %s\n' "$revision_path" >&2
    fi
    printf 'Run scripts/sync-ye-swlogic-manual.sh --update before committing.\n' >&2
    exit 1
  fi
  printf 'YE-SWlogic PDFs match %s %s.\n' "$source_label" "$source_commit"
  exit 0
fi

if (( ${#outdated[@]} == 0 && revision_changed == 0 )); then
  if [[ "$mode" == "--stage" ]]; then
    git -C "$repo_root" add -- "${target_paths[@]}" "$revision_path"
    printf 'YE-SWlogic PDFs already match and are staged at %s.\n' "$source_commit"
    exit 0
  fi
  printf 'YE-SWlogic PDFs are already synchronized at %s.\n' "$source_commit"
  exit 0
fi

for index in "${!target_paths[@]}"; do
  target="$repo_root/${target_paths[$index]}"
  mkdir -p "$(dirname -- "$target")"
  install -m 0644 "${source_files[$index]}" "$target"
done

mkdir -p "$(dirname -- "$target_revision")"
install -m 0644 "$revision_file" "$target_revision"

if [[ "$mode" == "--stage" ]]; then
  git -C "$repo_root" add -- "${target_paths[@]}" "$revision_path"
  printf 'Fetched %s %s and staged the YE-SWlogic PDFs.\n' "$source_label" "$source_commit"
else
  printf 'Updated the YE-SWlogic PDFs from %s %s (not staged).\n' "$source_label" "$source_commit"
fi
