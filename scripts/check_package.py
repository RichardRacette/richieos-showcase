"""Conservative artifact checks, not a privacy/security certification."""
from pathlib import Path, PurePosixPath
import argparse, hashlib, json, re, sys
IGNORED_DIRS={'.git','__pycache__','.pytest_cache'}
TEXT_EXT={'.md','.txt','.json','.html','.css','.js','.cjs','.py'}
PATTERNS={
    'credential-like token':r'\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{24,})\b',
    'private key header':r'-----BEGIN [A-Z ]*PRIVATE KEY-----',
    'private IPv4 address':r'\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b',
    'personal home path':r'(?:[A-Z]:\\Users\\[^\\\s]+|/(?:Users|home)/[A-Za-z0-9._-]+)',
    'email address':r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b',
}
def scan_tree(root):
    root=Path(root).resolve();issues=[]
    try:
        names=[s.strip() for s in (root/'PUBLIC-FILES.txt').read_text().splitlines() if s.strip() and not s.startswith('#')]
    except (OSError,UnicodeError):return ['Missing or unreadable PUBLIC-FILES.txt']
    if len(names)!=len(set(names)):issues.append('Duplicate allowlist entries')
    for name in names:
        q=PurePosixPath(name)
        if q.is_absolute() or '..' in q.parts or '\\' in name or any(s.startswith('.') for s in q.parts):issues.append('Unsafe allowlist path')
    if issues:return issues
    actual={f.relative_to(root).as_posix() for f in root.rglob('*') if (f.is_file() or f.is_symlink()) and not any(d in IGNORED_DIRS for d in f.relative_to(root).parts)}
    expected=set(names)
    for n in sorted(actual-expected):issues.append('Unreviewed file: '+n)
    for n in sorted(expected-actual):issues.append('Missing file: '+n)
    try:
        entries=json.loads((root/'SCREENSHOT-APPROVALS.json').read_text())['screenshots']
        if not isinstance(entries,list):raise ValueError()
        approvals={e['path']:e for e in entries}
    except (OSError,ValueError,KeyError,TypeError):return issues+['Invalid screenshot approval manifest']
    for name in sorted(actual & expected):
        f=root/name
        if f.is_symlink():issues.append('Symlink forbidden: '+name);continue
        if not f.resolve().is_relative_to(root):issues.append('Path escapes package: '+name);continue
        if f.stat().st_size>500_000:issues.append('Oversize file: '+name);continue
        raw=f.read_bytes()
        if f.suffix.lower() in {'.png','.jpg','.jpeg','.webp'}:
            a=approvals.get(name,{})
            if not (a.get('approved_by_owner') is True and a.get('approval_reference') and a.get('synthetic_only') is True and a.get('sha256')==hashlib.sha256(raw).hexdigest()):issues.append('Image lacks exact owner approval: '+name)
            continue
        if f.suffix.lower() not in TEXT_EXT:issues.append('Unapproved file type: '+name);continue
        try:text=raw.decode('utf-8')
        except UnicodeError:issues.append('Binary file forbidden: '+name);continue
        for label,pattern in PATTERNS.items():
            if re.search(pattern,text):issues.append(label+': '+name)
        if name.startswith('site/') and f.suffix in {'.js','.html','.css'}:
            for pattern in [r'\bfetch\s*\(',r'\bXMLHttpRequest\b',r'\bWebSocket\s*\(',r'\bsendBeacon\s*\(',r'\blocalStorage\b',r'\bsessionStorage\b',r'\bindexedDB\b',r'https?://',r'@import\b']:
                if re.search(pattern,text):issues.append('Disallowed runtime network/storage pattern: '+name)
    return issues
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]));args=parser.parse_args()
    issues=scan_tree(args.root)
    if issues:
        print('\n'.join(issues));sys.exit(1)
    print('PASS: allowlist, text/asset approval and heuristic privacy checks. Manual review still required.')
