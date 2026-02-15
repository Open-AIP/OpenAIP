"use client";

export default function SecurityNoticeBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
      <span className="font-semibold">Security Notice:</span> All configuration changes on this page
      are high-impact and require confirmation before being applied. Changes are audit-logged with
      administrator identity and timestamps.
    </div>
  );
}

