"""Verified Linux build-tool bootstrap. Does not change environment configuration."""
import hashlib
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import urllib.parse
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
TOOLS = pathlib.Path(os.environ.get('GOAT_TOOLCHAIN_DIR', str(ROOT / '.toolchains')))
TOOLS.mkdir(parents=True, exist_ok=True)

def artifact(name, url, digest):
    path = TOOLS / name
    if not path.exists():
        with urllib.request.urlopen(url, timeout=120) as source, path.open('wb') as target:
            shutil.copyfileobj(source, target)
    if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise SystemExit('Checksum mismatch; remove and redownload ' + str(path))
    return path

jdk_archive = artifact('OpenJDK8U-jdk_x64_linux_hotspot_8u472b08.tar.gz',
    'https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u472-b08/OpenJDK8U-jdk_x64_linux_hotspot_8u472b08.tar.gz',
    '5becaa4ac660e844c5a39e2ebc39ff5ac824c37ff1b625af8c8b111dc13c3592')
gradle_archive = artifact('gradle-2.14.1-bin.zip',
    'https://downloads.gradle.org/distributions/gradle-2.14.1-bin.zip',
    'cfc61eda71f2d12a572822644ce13d2919407595c2aec3e3566d2aab6f97ef39')
jdk = TOOLS / 'jdk8u472-b08'
if not jdk.exists():
    with tarfile.open(jdk_archive) as archive:
        archive.extractall(TOOLS, filter='data')
gradle = TOOLS / 'gradle-2.14.1/bin/gradle'
if not gradle.exists():
    with zipfile.ZipFile(gradle_archive) as archive:
        archive.extractall(TOOLS)
gradle.chmod(0o755)

options = ['-Xmx3g']
certificate = os.environ.get('CODEX_PROXY_CERT')
if certificate and pathlib.Path(certificate).is_file():
    trust = TOOLS / 'goat-session-cacerts'
    shutil.copyfile(jdk / 'jre/lib/security/cacerts', trust)
    subprocess.run([str(jdk / 'bin/keytool'), '-importcert', '-noprompt', '-alias',
        'goat-session-ca', '-file', certificate, '-keystore', str(trust),
        '-storepass', 'changeit'], check=True, stdout=subprocess.DEVNULL)
    options += ['-Djavax.net.ssl.trustStore=' + str(trust),
                '-Djavax.net.ssl.trustStorePassword=changeit',
                '-Djavax.net.ssl.trustStoreType=JKS']
proxy_options = []
for scheme in ('http', 'https'):
    value = os.environ.get(scheme.upper() + '_PROXY')
    if value:
        proxy = urllib.parse.urlsplit(value)
        if proxy.username or proxy.password:
            raise SystemExit('Authenticated proxy must be configured securely in Gradle settings')
        if not proxy.hostname or not proxy.port:
            raise SystemExit('Proxy host/port missing')
        proxy_options += ['-D' + scheme + '.proxyHost=' + proxy.hostname,
                          '-D' + scheme + '.proxyPort=' + str(proxy.port)]
        options += proxy_options[-2:]

environment = os.environ.copy()
environment['JAVA_HOME'] = str(jdk)
environment.setdefault('GRADLE_USER_HOME', str(ROOT / '.gradle-home'))
arguments = sys.argv[1:] or ['build']
result = subprocess.run([str(gradle), '--no-daemon',
    '-Dorg.gradle.jvmargs=' + ' '.join(options)] + proxy_options + arguments,
    cwd=ROOT, env=environment)
if result.returncode == 0 and 'setupDecompWorkspace' in arguments:
    result = subprocess.run([sys.executable, str(ROOT / 'tools/fetch-assets.py')], cwd=ROOT, env=environment)
raise SystemExit(result.returncode)
