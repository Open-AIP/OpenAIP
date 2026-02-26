from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class HttpCallResult:
    http_status: int | None
    json_body: dict[str, Any] | None
    raw_text: str | None
    error: str | None
    attempts: int
    timing_ms: float


class WebsiteChatClient:
    def __init__(
        self,
        base_url: str,
        bearer_token: str | None = None,
        cookie_header: str | None = None,
        timeout_s: float = 30.0,
        max_retries: int = 6,
        backoff_base_s: float = 0.5,
        backoff_cap_s: float = 8.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.backoff_base_s = backoff_base_s
        self.backoff_cap_s = backoff_cap_s

        headers = {"Content-Type": "application/json"}
        if bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"
        if cookie_header:
            headers["Cookie"] = cookie_header

        self._client = httpx.Client(
            timeout=httpx.Timeout(timeout_s),
            headers=headers,
            follow_redirects=True,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "WebsiteChatClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def post_message(self, content: str, session_id: str | None = None) -> HttpCallResult:
        endpoint = f"{self.base_url}/api/barangay/chat/messages"
        payload: dict[str, Any] = {"content": content}
        if session_id:
            payload["sessionId"] = session_id

        started = time.perf_counter()
        last_error: str | None = None

        for attempt in range(1, self.max_retries + 2):
            try:
                response = self._client.post(endpoint, json=payload)
                status = response.status_code

                if status in {429, 502, 503, 504} and attempt <= self.max_retries:
                    self._sleep_with_backoff(attempt)
                    continue

                body: dict[str, Any] | None = None
                text_body: str | None = None
                try:
                    parsed = response.json()
                    if isinstance(parsed, dict):
                        body = parsed
                    else:
                        text_body = response.text
                except ValueError:
                    text_body = response.text

                return HttpCallResult(
                    http_status=status,
                    json_body=body,
                    raw_text=text_body,
                    error=None,
                    attempts=attempt,
                    timing_ms=(time.perf_counter() - started) * 1000,
                )
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = str(exc)
                if attempt <= self.max_retries:
                    self._sleep_with_backoff(attempt)
                    continue
                return HttpCallResult(
                    http_status=None,
                    json_body=None,
                    raw_text=None,
                    error=last_error,
                    attempts=attempt,
                    timing_ms=(time.perf_counter() - started) * 1000,
                )

        return HttpCallResult(
            http_status=None,
            json_body=None,
            raw_text=None,
            error=last_error or "Unknown HTTP failure",
            attempts=self.max_retries + 1,
            timing_ms=(time.perf_counter() - started) * 1000,
        )

    def _sleep_with_backoff(self, attempt: int) -> None:
        backoff = min(self.backoff_cap_s, self.backoff_base_s * (2 ** (attempt - 1)))
        jitter = random.uniform(0, backoff * 0.2)
        time.sleep(backoff + jitter)

