const REPO = 'haneelteja/Sales-Operations-Portal';

// Proxy the latest.json that Tauri CI generates and uploads to each GitHub Release.
// Tauri 2 handles version comparison on the client side, so we just return the manifest.
export default async function handler(req, res) {
  const apiRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    {
      headers: {
        'User-Agent': 'aamodha-update-server/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!apiRes.ok) return res.status(204).end();

  const release = await apiRes.json();
  const asset = release.assets?.find(a => a.name === 'latest.json');

  if (!asset) return res.status(204).end();

  const manifest = await fetch(asset.browser_download_url).then(r => r.json());

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).json(manifest);
}
