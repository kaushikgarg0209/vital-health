import { NextRequest, NextResponse } from "next/server";

const API_PROXY_URL = process.env.API_PROXY_URL ?? "http://localhost:3001";

function copyResponseHeaders(
  backendResponse: Response,
  target: Headers,
): void {
  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    target.set(key, value);
  });

  const setCookies =
    typeof backendResponse.headers.getSetCookie === "function"
      ? backendResponse.headers.getSetCookie()
      : [];

  for (const cookie of setCookies) {
    target.append("set-cookie", cookie);
  }
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = new URL(`/api/v1/${path.join("/")}`, API_PROXY_URL);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType?.includes("multipart/form-data")) {
      init.body = await request.arrayBuffer();
    } else {
      init.body = await request.text();
    }
  }

  const backendResponse = await fetch(targetUrl.toString(), init);
  const responseHeaders = new Headers();
  copyResponseHeaders(backendResponse, responseHeaders);

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
