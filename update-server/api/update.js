const REPO = 'haneelteja/Sales-Operations-Portal';

export default async function handler(req, res) {
  const { target, arch, version } = req.query;

  if (!target || !arch || !version) {
    return res.status(400).json({ error: 'Missing params: target, arch, version required' });
  }

  const apiRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    {
      headers: {
        'User-Agent': 'aamodha-update-server/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!apiRes.ok) return res.status(500).json({ error: `GitHub API error: ${apiRes.status}` });

  const release = await apiRes.json();
  const latestVersion = release.tag_name.replace(/^v/, '');

  if (latestVersion === version) return res.status(204).end();

  const assets = release.assets ?? [];

  let url, sigUrl;

  if (target === 'windows-x86_64') {
    url    = assets.find(a => a.name.endsWith('.msi.zip'))?.browser_download_url;
    sigUrl = assets.find(a => a.name.endsWith('.msi.zip.sig'))?.browser_download_url;
  } else if (target.startsWith('darwin')) {
    url    = assets.find(a => a.name.endsWith('.app.tar.gz'))?.browser_download_url;
    sigUrl = assets.find(a => a.name.endsWith('.app.tar.gz.sig'))?.browser_download_url;
  }

  if (!url || !sigUrl) return res.status(204).end();

  const signature = await fetch(sigUrl).then(r => r.text());

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).json({
    version: latestVersion,
    notes: release.body ?? '',
    pub_date: release.published_at,
    platforms: {
      [target]: { url, signature: signature.trim() },
    },
  });
}
