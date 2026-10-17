#!/usr/bin/env bash
set -euo pipefail

hugo_version="0.128.0"
if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  printf 'This setup script currently supports Linux x86_64.\n' >&2
  exit 1
fi

archive_name="hugo_extended_${hugo_version}_linux-amd64.tar.gz"
release_url="https://github.com/gohugoio/hugo/releases/download/v${hugo_version}"
data_root="${XDG_DATA_HOME:-$HOME/.local/share}"
install_dir="$data_root/hugo/$hugo_version"
bin_dir="$HOME/.local/bin"

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/hugo-preview-setup.XXXXXX")"
trap 'rm -rf -- "$tmpdir"' EXIT

curl --fail --location --silent --show-error \
  "$release_url/$archive_name" \
  --output "$tmpdir/$archive_name"
curl --fail --location --silent --show-error \
  "$release_url/hugo_${hugo_version}_checksums.txt" \
  --output "$tmpdir/checksums.txt"

if ! (cd "$tmpdir" && grep -F "  $archive_name" checksums.txt | sha256sum --check --status); then
  printf 'Hugo archive checksum verification failed.\n' >&2
  exit 1
fi

tar -xzf "$tmpdir/$archive_name" -C "$tmpdir" hugo
install -d "$install_dir" "$bin_dir"
install -m 0755 "$tmpdir/hugo" "$install_dir/hugo"
ln -sfn "$install_dir/hugo" "$bin_dir/hugo"

installed_version="$("$bin_dir/hugo" version)"
if [[ "$installed_version" != *"v${hugo_version}"* || "$installed_version" != *"extended"* ]]; then
  printf 'Unexpected Hugo installation: %s\n' "$installed_version" >&2
  exit 1
fi

printf 'Installed %s\n' "$installed_version"
printf 'Start the preview from the repository root with: hugo server --bind 127.0.0.1 --baseURL http://127.0.0.1:1313/\n'
