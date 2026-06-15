export function getBackendUrl(path) {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  const backendBaseUrl = '';

  // Remove any leading slashes or "uploads/" prefix to prevent double paths
  const cleanPath = path.replace(/^\//, '').replace(/^uploads\//, '');
  
  return `${backendBaseUrl}/uploads/${cleanPath}`;
}