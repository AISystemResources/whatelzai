"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

/** Uses the router's real pending state, including interruption and completion. */
export default function AdminLink({
  children,
  ...props
}: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props} data-admin-link="">
      {children}
      <NavigationFeedback />
    </NextLink>
  );
}

function NavigationFeedback() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      data-navigation-pending=""
      role="status"
      className="admin-navigation-pending"
    >
      <span aria-hidden="true" className="admin-loading-dot" />
      Opening page…
    </span>
  );
}
