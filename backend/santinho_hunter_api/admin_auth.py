from __future__ import annotations

from base64 import urlsafe_b64decode, urlsafe_b64encode
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import json
from threading import Lock
from time import monotonic


class AdminAuthError(ValueError):
    pass


@dataclass(frozen=True)
class AdminSession:
    token: str
    expires_at: datetime


class AdminAuthenticator:
    def __init__(self, password: str, secret: str, ttl_seconds: int) -> None:
        self.password = password
        self.secret = secret.encode("utf-8")
        self.ttl_seconds = ttl_seconds

    @property
    def configured(self) -> bool:
        return bool(self.password and self.secret)

    def login(self, password: str) -> AdminSession:
        if not self.configured:
            raise AdminAuthError("Administração não configurada")
        if not hmac.compare_digest(password.encode("utf-8"), self.password.encode("utf-8")):
            raise AdminAuthError("Senha inválida")

        expires_at = datetime.now(UTC) + timedelta(seconds=self.ttl_seconds)
        payload = self._encode(
            json.dumps({"exp": int(expires_at.timestamp())}, separators=(",", ":")).encode()
        )
        signature = self._sign(payload)
        return AdminSession(token=f"{payload}.{signature}", expires_at=expires_at)

    def verify(self, token: str) -> None:
        if not self.configured:
            raise AdminAuthError("Administração não configurada")
        try:
            payload, signature = token.split(".", 1)
            if not hmac.compare_digest(signature, self._sign(payload)):
                raise AdminAuthError("Sessão inválida")
            data = json.loads(urlsafe_b64decode(self._pad(payload)))
            if int(data["exp"]) <= int(datetime.now(UTC).timestamp()):
                raise AdminAuthError("Sessão expirada")
        except AdminAuthError:
            raise
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            raise AdminAuthError("Sessão inválida") from exc

    def _sign(self, payload: str) -> str:
        digest = hmac.new(self.secret, payload.encode("ascii"), hashlib.sha256).digest()
        return self._encode(digest)

    @staticmethod
    def _encode(value: bytes) -> str:
        return urlsafe_b64encode(value).decode("ascii").rstrip("=")

    @staticmethod
    def _pad(value: str) -> str:
        return value + "=" * (-len(value) % 4)


class LoginRateLimiter:
    def __init__(self, attempts: int = 5, window_seconds: int = 15 * 60) -> None:
        self.attempts = attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> bool:
        now = monotonic()
        with self._lock:
            attempts = self._attempts[key]
            while attempts and now - attempts[0] >= self.window_seconds:
                attempts.popleft()
            return len(attempts) < self.attempts

    def fail(self, key: str) -> None:
        with self._lock:
            self._attempts[key].append(monotonic())

    def clear(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)
