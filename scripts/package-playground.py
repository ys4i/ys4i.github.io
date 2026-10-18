#!/usr/bin/env python3
"""Publish one coherent, content-addressed Playground asset release after Hugo."""

import argparse
import hashlib
import json
from pathlib import Path


def package(public_dir: Path, source_dir: Path) -> dict:
    target = public_dir / 'playground' / 'drawer-labels'
    if not (target / 'index.html').is_file():
        raise ValueError('Run Hugo first: playground/drawer-labels/index.html is missing.')
    files = {
        name: (source_dir / name).read_bytes()
        for name in (
            'app.js', 'xlsx.js', 'labels.js', 'packing.js', 'styles.css',
            'sample.xlsx', 'vendor/fflate.js', 'vendor/fflate-LICENSE.txt',
        )
    }
    files['base.css'] = (source_dir.parent / 'playground.css').read_bytes()
    html = (source_dir / 'index.html').read_text(encoding='utf-8')
    digest = hashlib.sha256(html.encode('utf-8'))
    for name, data in sorted(files.items()):
        digest.update(name.encode('utf-8') + b'\0' + data + b'\0')
    version = digest.hexdigest()[:16]
    prefix = f'./assets/{version}/'
    for old, new in (
        ('../playground.css', prefix + 'base.css'),
        ('./styles.css', prefix + 'styles.css'),
        ('./app.js', prefix + 'app.js'),
        ('./sample.xlsx', prefix + 'sample.xlsx'),
    ):
        if html.count(f'"{old}"') != 1:
            raise ValueError(f'Expected exactly one HTML reference to {old!r}.')
        html = html.replace(f'"{old}"', f'"{new}"')
    release = target / 'assets' / version
    for name, data in files.items():
        destination = release / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
    # Keep an existing cached HTML page's release when packaging the same output again.
    # All imports are relative, so each module stays inside its own version directory.
    (target / 'index.html').write_text(html, encoding='utf-8')
    return {'version': version, 'assets': len(files), 'url_prefix': prefix}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public-dir', type=Path, default=Path('public'))
    parser.add_argument('--source-dir', type=Path, default=Path(__file__).resolve().parents[1] / 'static/playground/drawer-labels')
    args = parser.parse_args()
    print(json.dumps(package(args.public_dir, args.source_dir)))


if __name__ == '__main__':
    main()
