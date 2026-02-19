from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()


def _env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not set.")
    return value


@dataclass
class SupabaseConfig:
    url: str
    service_key: str


def load_supabase_config() -> SupabaseConfig:
    url = _env("SUPABASE_URL").rstrip("/")
    service_key = _env("SUPABASE_SERVICE_KEY")
    return SupabaseConfig(url=url, service_key=service_key)


class SupabaseRestClient:
    def __init__(self, config: Optional[SupabaseConfig] = None):
        self.config = config or load_supabase_config()
        self.base_url = self.config.url
        self.service_key = self.config.service_key

    def _headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        if extra:
            headers.update(extra)
        return headers

    def _rest_url(self, table: str, query: Optional[Dict[str, str]] = None) -> str:
        url = f"{self.base_url}/rest/v1/{table}"
        if not query:
            return url
        return f"{url}?{urllib.parse.urlencode(query, safe=',()*.')}"

    def _request(
        self,
        method: str,
        url: str,
        *,
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        body = None
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url=url,
            data=body,
            headers=self._headers(headers),
            method=method,
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)

    def select(
        self,
        table: str,
        *,
        select: str,
        filters: Optional[Dict[str, str]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, str] = {"select": select}
        if filters:
            query.update(filters)
        if order:
            query["order"] = order
        if limit is not None:
            query["limit"] = str(limit)
        url = self._rest_url(table, query=query)
        data = self._request("GET", url)
        return data or []

    def insert(
        self,
        table: str,
        row: Dict[str, Any],
        *,
        select: Optional[str] = None,
        on_conflict: Optional[str] = None,
        upsert: bool = False,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, str] = {}
        if select:
            query["select"] = select
        if on_conflict:
            query["on_conflict"] = on_conflict
        headers = {"Prefer": "return=representation"}
        if upsert:
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        url = self._rest_url(table, query=query or None)
        data = self._request("POST", url, payload=row, headers=headers)
        return data or []

    def update(
        self,
        table: str,
        patch: Dict[str, Any],
        *,
        filters: Dict[str, str],
        select: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = dict(filters)
        if select:
            query["select"] = select
        url = self._rest_url(table, query=query)
        data = self._request(
            "PATCH",
            url,
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
            raise RuntimeError("Signed URL is missing from response.")

        if signed.startswith("http://") or signed.startswith("https://"):
            return signed

        if signed.startswith("/"):
            return f"{self.base_url}/storage/v1{signed}"

        return f"{self.base_url}/storage/v1/{signed}"

    @staticmethod
    def download_bytes(url: str) -> bytes:
        req = urllib.request.Request(url=url, method="GET")
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read()
