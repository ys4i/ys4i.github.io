"""Run with: python3 -B -m unittest discover -s tests/playground -p 'test_*.py'."""

import importlib.util
from pathlib import Path
import re
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('package_playground', ROOT / 'scripts/package-playground.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source/drawer-labels'
        shutil.copytree(ROOT / 'static/playground/drawer-labels', self.source)
        shutil.copyfile(ROOT / 'static/playground/playground.css', self.source.parent / 'playground.css')
        self.public = self.root / 'public'
        self.target = self.public / 'playground/drawer-labels'
        self.target.mkdir(parents=True)
        shutil.copyfile(self.source / 'index.html', self.target / 'index.html')

    def test_entire_module_graph_and_css_share_one_version(self):
        result = packager.package(self.public, self.source)
        release = self.target / 'assets' / result['version']
        html = (self.target / 'index.html').read_text()
        for filename in ['app.js', 'styles.css', 'base.css', 'sample.xlsx']:
            self.assertIn(result['url_prefix'] + filename, html)
        pending = ['app.js']
        checked = set()
        while pending:
            path = pending.pop()
            if path in checked:
                continue
            checked.add(path)
            content = (release / path).read_text()
            imports = re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]", content)
            for imported in imports:
                self.assertTrue(imported.startswith('./'), imported)
                dependency = (release / path).parent / imported
                self.assertTrue(dependency.is_file(), dependency)
                pending.append(str(dependency.relative_to(release)))
        self.assertEqual(checked, {'app.js', 'labels.js', 'packing.js', 'xlsx.js', 'vendor/fflate.js'})

    def test_nested_module_change_changes_all_asset_urls(self):
        before = packager.package(self.public, self.source)
        nested = self.source / 'packing.js'
        nested.write_text(nested.read_text() + '\n// next release\n')
        after = packager.package(self.public, self.source)
        self.assertNotEqual(before['version'], after['version'])
        self.assertIn(after['url_prefix'] + 'app.js', (self.target / 'index.html').read_text())
        old = self.target / 'assets' / before['version'] / 'packing.js'
        self.assertNotIn('next release', old.read_text())

    def test_repeat_packaging_is_deterministic(self):
        first = packager.package(self.public, self.source)
        html = (self.target / 'index.html').read_bytes()
        self.assertEqual(first, packager.package(self.public, self.source))
        self.assertEqual(html, (self.target / 'index.html').read_bytes())

    def test_missing_hugo_output_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Run Hugo first'):
            packager.package(self.root / 'missing', self.source)
