from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

from openaip_pipeline.core.settings import Settings


@dataclass(frozen=True)
class SupabaseConfig:
    url: str
    service_key: str


class SupabaseRestClient:
    def __init__(self, config: SupabaseConfig):
        self.config = config
        self.base_url = config.url.rstrip("/")
        self.service_key = config.service_key

    @classmethod
    def from_settings(cls, settings: Settings) -> "SupabaseRestClient":
        return cls(SupabaseConfig(url=settings.supabase_url, service_key=settings.supabase_service_key))

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        if extra:
            headers.update(extra)
        return headers

    def _rest_url(self, table: str, query: dict[str, str] | None = None) -> str:
        url = f"{self.base_url}/rest/v1/{table}"
        if not query:
            return url
        return f"{url}?{urllib.parse.urlencode(query, safe=',()*.')}"

    def _request(
        self,
        method: str,
        url: str,
        *,
        payload: dict[str, Any] | None = None,
        raw_bytes: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        body = raw_bytes
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url=url, data=body, headers=self._headers(headers), method=method)
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
            if not data:
                return None
            if (response.headers.get("Content-Type") or "").startswith("application/json"):
                return json.loads(data.decode("utf-8"))
            return data

    def select(
        self,
        table: str,
        *,
        select: str,
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, str] = {"select": select}
        if filters:
            query.update(filters)
        if order:
            query["order"] = order
        if limit is not None:
            query["limit"] = str(limit)
        data = self._request("GET", self._rest_url(table, query))
        return data or []

    def insert(
        self,
        table: str,
        row: dict[str, Any],
        *,
        select: str | None = None,
        on_conflict: str | None = None,
        upsert: bool = False,
    ) -> list[dict[str, Any]]:
        query: dict[str, str] = {}
        if select:
            query["select"] = select
        if on_conflict:
            query["on_conflict"] = on_conflict
        headers = {"Prefer": "return=representation"}
        if upsert:
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        data = self._request("POST", self._rest_url(table, query or None), payload=row, headers=headers)
        return data or []

    def update(
        self,
        table: str,
        patch: dict[str, Any],
        *,
        filters: dict[str, str],
        select: str | None = None,
    ) -> list[dict[str, Any]]:
        query = dict(filters)
        if select:
            query["select"] = select
        data = self._request(
            "PATCH",
            self._rest_url(table, query),
            payload=patch,
            headers={"Prefer": "return=representation"},
        )
        return data or []

    def create_signed_url(self, bucket_id: str, object_name: str, expires_in: int = 600) -> str:
        object_path = urllib.parse.quote(object_name, safe="/")
        url = f"{self.base_url}/storage/v1/object/sign/{bucket_id}/{object_path}"
        data = self._request("POST", url, payload={"expiresIn": expires_in})
        if not isinstance(data, dict):
            raise RuntimeError("Signed URL response is invalid.")
        signed = data.get("signedURL") or data.get("signedUrl")
        if not isinstance(signed, str) or not signed:
            raise RuntimeError("Signed URL is missing.")
        if signed.startswith("http://") or signed.startswith("https://"):
            return signed
        if signed.startswith("/"):
            return f"{self.base_url}/storage/v1{signed}"
        return f"{self.base_url}/storage/v1/{signed}"

    @staticmethod
    def download_bytes(url: str) -> bytes:
        req = urllib.request.Request(url=url, method="GET")
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read()

    def upload_bytes(self, *, bucket_id: str, object_name: str, content: bytes, content_type: str) -> str:
        object_path = urllib.parse.quote(object_name, safe="/")
        url = f"{self.base_url}/storage/v1/object/{bucket_id}/{object_path}"
        self._request(
            "POST",
            url,
            raw_bytes=content,
            headers={
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )
        return object_name

