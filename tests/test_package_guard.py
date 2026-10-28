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
if __name__=='__main__':unittest.main()
