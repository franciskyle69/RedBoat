import React from "react";

interface AdminTableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminTableContainer({
  children,
  className,
}: AdminTableContainerProps) {
  const classes = ["bookings-table-container"];
  if (className && className.trim()) {
    classes.push(className);
  }

  return <div className={classes.join(" ")}>{children}</div>;
}
