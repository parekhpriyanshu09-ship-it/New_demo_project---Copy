from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, list] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)
        current_time = time.time()

        if client_ip in self._requests:
            self._requests[client_ip] = [
                req_time for req_time in self._requests[client_ip]
                if current_time - req_time < self.window_seconds
            ]
        else:
            self._requests[client_ip] = []

        if len(self._requests[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."}
            )

        self._requests[client_ip].append(current_time)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self._requests[client_ip])
        )

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_attempts: int = 5, lockout_minutes: int = 15):
        super().__init__(app)
        self.max_attempts = max_attempts
        self.lockout_minutes = lockout_minutes
        self._attempts: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next):
        if request.url.path != "/api/auth/login" or request.method != "POST":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()

        if client_ip in self._attempts:
            attempts, first_attempt_time = self._attempts[client_ip]

            if current_time - first_attempt_time < self.lockout_minutes * 60:
                if attempts >= self.max_attempts:
                    remaining = int(self.lockout_minutes * 60 - (current_time - first_attempt_time))
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": f"Too many login attempts. Try again in {remaining // 60 + 1} minutes."
                        }
                    )
            else:
                del self._attempts[client_ip]

        response = await call_next(request)

        if response.status_code == 401:
            if client_ip in self._attempts:
                attempts, first_attempt_time = self._attempts[client_ip]
                self._attempts[client_ip] = (attempts + 1, first_attempt_time)
            else:
                self._attempts[client_ip] = (1, current_time)
        elif response.status_code == 200:
            if client_ip in self._attempts:
                del self._attempts[client_ip]

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"