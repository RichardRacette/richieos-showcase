import importlib.util, tempfile, unittest, json, hashlib
from pathlib import Path
MODULE=Path(__file__).parents[1]/'scripts/check_package.py'
if MODULE.exists():
    spec=importlib.util.spec_from_file_location('guard',MODULE);guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
else: guard=None
class PackageGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        (self.root/'PUBLIC-FILES.txt').write_text('PUBLIC-FILES.txt\nREADME.md\nSCREENSHOT-APPROVALS.json\n')
        (self.root/'README.md').write_text('Synthetic example.\n')
        (self.root/'SCREENSHOT-APPROVALS.json').write_text('{"screenshots":[]}')
    def tearDown(self):self.temp.cleanup()
    def scan(self):
        self.assertIsNotNone(guard,'Package guard has not been implemented')
        return guard.scan_tree(self.root)
    def test_clean_fixture_passes(self):self.assertEqual(self.scan(),[])
    def test_guard_can_scan_itself(self):
        (self.root/'scripts').mkdir()
        (self.root/'scripts/check_package.py').write_text(MODULE.read_text())
        with (self.root/'PUBLIC-FILES.txt').open('a') as f:f.write('scripts/check_package.py\n')
        self.assertEqual(self.scan(),[])
    def test_extra_file_fails(self):
        (self.root/'unreviewed.txt').write_text('unexpected');self.assertTrue(self.scan())
    def test_missing_file_fails(self):
        (self.root/'README.md').unlink();self.assertTrue(self.scan())
    def test_credential_pattern_fails(self):
        (self.root/'README.md').write_text('ghp_'+'A'*36);self.assertTrue(self.scan())
    def test_private_address_fails(self):
        (self.root/'README.md').write_text('192.'+'168.'+'1.'+'7');self.assertTrue(self.scan())
    def test_symlink_fails(self):
        (self.root/'README.md').unlink()
        try:
            (self.root/'README.md').symlink_to('SCREENSHOT-APPROVALS.json')
        except (OSError, NotImplementedError) as error:
            self.skipTest('Symlink creation unavailable on this system: '+str(error))
        self.assertTrue(self.scan())
    def test_unapproved_screenshot_fails(self):
        with (self.root/'PUBLIC-FILES.txt').open('a') as f:f.write('screenshots/demo.png\n')
        (self.root/'screenshots').mkdir();(self.root/'screenshots/demo.png').write_bytes(b'not-a-real-image')
        self.assertTrue(self.scan())
    def test_bad_allowlist_path_fails(self):
        with (self.root/'PUBLIC-FILES.txt').open('a') as f:f.write('../outside.txt\n')
        self.assertTrue(self.scan())
    def add_demo_file(self,name,text):
        p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
        with (self.root/'PUBLIC-FILES.txt').open('a') as f:f.write(name+'\n')
    def test_geometric_svg_and_module_pass(self):
        self.add_demo_file('demos/example/icon.svg','<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>')
        self.add_demo_file('demos/example/app.mjs','export const fictional = true;')
        self.assertEqual(self.scan(),[])
    def test_demo_network_and_storage_fail(self):
        for code in ['fetch("/upload")','localStorage.setItem("x","y")']:
            with self.subTest(code=code):
                self.add_demo_file('demos/example/app.mjs',code)
                self.assertTrue(any('runtime network/storage' in e for e in self.scan()))
                p=self.root/'PUBLIC-FILES.txt';p.write_text(p.read_text().replace('demos/example/app.mjs\n',''))
    def test_svg_active_content_fails(self):
        self.add_demo_file('demos/example/icon.svg','<svg xmlns="http://www.w3.org/2000/svg"><script>run()</script></svg>')
        self.assertTrue(any('SVG active' in e for e in self.scan()))
    def test_svg_external_reference_fails(self):
        self.add_demo_file('demos/example/icon.svg','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/a.png"/></svg>')
        self.assertTrue(any('SVG external' in e for e in self.scan()))
    def test_inline_svg_namespace_is_not_a_network_request(self):
        self.add_demo_file('demos/example/index.html','<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>')
        self.assertEqual(self.scan(),[])
    def test_inline_svg_external_url_still_fails(self):
        self.add_demo_file('demos/example/index.html','<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/a.png"/></svg>')
        self.assertTrue(any('runtime network/storage' in e for e in self.scan()))
    def test_exact_approved_screenshot_passes_then_changed_hash_fails(self):
        name='screenshots/demo.png';p=self.root/name;p.parent.mkdir();p.write_bytes(b'fixture-image')
        with (self.root/'PUBLIC-FILES.txt').open('a') as f:f.write(name+'\n')
        approval={'path':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'approved_by_owner':True,'synthetic_only':True,'approval_reference':'test-owner-approval'}
        (self.root/'SCREENSHOT-APPROVALS.json').write_text(json.dumps({'screenshots':[approval]}))
        self.assertEqual(self.scan(),[])
        p.write_bytes(b'changed-image');self.assertTrue(self.scan())
if __name__=='__main__':unittest.main()
