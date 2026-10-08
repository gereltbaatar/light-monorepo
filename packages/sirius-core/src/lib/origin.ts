// request.url carries the bind address under `-H 0.0.0.0` or a proxy.
export function browserOrigin(headers: Headers, fallbackUrl?: string): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");

  if (host) {
    const proto =
      headers.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return fallbackUrl ? new URL(fallbackUrl).origin : "";
}
