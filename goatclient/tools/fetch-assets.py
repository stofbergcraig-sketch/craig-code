"""Repair ForgeGradle 2's HTTP asset downloads using Mojang HTTPS + index hashes."""
import concurrent.futures
import hashlib
import json
import pathlib
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
assets = root / '.gradle-home/caches/minecraft/assets'
index = json.loads((assets / 'indexes/1.8.json').read_text())

def fetch(entry):
    name, record = entry
    digest = record['hash']
    if len(digest) != 40 or any(c not in '0123456789abcdef' for c in digest):
        raise ValueError('Invalid asset hash')
    target = assets / 'objects' / digest[:2] / digest
    if target.exists() and hashlib.sha1(target.read_bytes()).hexdigest() == digest:
        return
    url = 'https://resources.download.minecraft.net/' + digest[:2] + '/' + digest
    with urllib.request.urlopen(url, timeout=45) as response:
        data = response.read()
    if hashlib.sha1(data).hexdigest() != digest:
        raise ValueError('Checksum mismatch: ' + name)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(fetch, index['objects'].items()))
print('Verified', len(index['objects']), 'Minecraft asset entries')
