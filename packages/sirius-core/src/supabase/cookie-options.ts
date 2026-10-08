// A parent domain lets one sign-in cover every Sirius subdomain.
const domain = process.env.NEXT_PUBLIC_SIRIUS_COOKIE_DOMAIN;

export const cookieOptions = domain ? { domain } : undefined;
