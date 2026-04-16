import hashlib
import os
import secrets
import time
from datetime import UTC, datetime

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72
REFRESH_TOKEN_EXPIRE_DAYS = 30

_jwt_secret = os.environ.get("JWT_SECRET", "")
if not _jwt_secret:
    _jwt_secret = hashlib.sha256(
        (os.environ.get("KEM_MASTER_SEED", "dev-seed") + "qurabia-auth-2026").encode()
    ).hexdigest()

# Token revocation list (in-memory, use Redis in production)
_revoked_tokens: set[str] = set()

# Refresh tokens storage
_refresh_tokens: dict[str, dict] = {}


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    avatar: str | None = None
    plan: str = "explorer"
    provider: str = "email"
    created_at: str | None = None


class TokenResponse(BaseModel):
    token: str
    user: UserOut
    refresh_token: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


_users_db: dict[str, dict] = {}


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(
    user_id: str,
    email: str,
    name: str,
    avatar: str | None = None,
    plan: str = "explorer",
    provider: str = "email",
    token_type: str = "access",
) -> str:
    if token_type == "refresh":
        expire = time.time() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    else:
        expire = time.time() + ACCESS_TOKEN_EXPIRE_HOURS * 3600

    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "avatar": avatar,
        "plan": plan,
        "provider": provider,
        "type": token_type,
        "exp": expire,
        "jti": secrets.token_hex(16),  # Unique token ID for revocation
    }
    return jwt.encode(payload, _jwt_secret, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, _jwt_secret, algorithms=[ALGORITHM])
        # Check if token is revoked
        jti = payload.get("jti")
        if jti and jti in _revoked_tokens:
            return None
        return payload
    except JWTError:
        return None


def _decode_google_credential(credential: str) -> dict | None:
    try:
        parts = credential.split(".")
        if len(parts) != 3:
            return None
        import base64
        import json

        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception:
        return None


def register_user(name: str, email: str, password: str) -> TokenResponse:
    if email in _users_db:
        raise ValueError("البريد الإلكتروني مسجل بالفعل")
    if len(password) < 8:
        raise ValueError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")

    user_id = f"user-{secrets.token_hex(8)}"
    now = datetime.now(UTC).isoformat()

    _users_db[email] = {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": _hash_password(password),
        "avatar": None,
        "plan": "explorer",
        "provider": "email",
        "created_at": now,
    }

    token = _create_token(user_id, email, name, plan="explorer", provider="email")
    refresh_token = _create_token(user_id, email, name, plan="explorer", provider="email", token_type="refresh")

    # Store refresh token
    _refresh_tokens[refresh_token] = {
        "user_id": user_id,
        "email": email,
        "created_at": now,
    }

    return TokenResponse(
        token=token,
        user=UserOut(id=user_id, name=name, email=email, plan="explorer", provider="email", created_at=now),
        refresh_token=refresh_token,
    )


def login_user(email: str, password: str) -> TokenResponse:
    user = _users_db.get(email)
    if not user or not _verify_password(password, user["password_hash"]):
        raise ValueError("البريد الإلكتروني أو كلمة المرور غير صحيحة")

    token = _create_token(
        user["id"],
        user["email"],
        user["name"],
        avatar=user.get("avatar"),
        plan=user.get("plan", "explorer"),
        provider=user.get("provider", "email"),
    )
    refresh_token = _create_token(
        user["id"],
        user["email"],
        user["name"],
        avatar=user.get("avatar"),
        plan=user.get("plan", "explorer"),
        provider=user.get("provider", "email"),
        token_type="refresh",
    )

    # Store refresh token
    _refresh_tokens[refresh_token] = {
        "user_id": user["id"],
        "email": user["email"],
        "created_at": datetime.now(UTC).isoformat(),
    }

    return TokenResponse(
        token=token,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            avatar=user.get("avatar"),
            plan=user.get("plan", "explorer"),
            provider=user.get("provider", "email"),
            created_at=user.get("created_at"),
        ),
        refresh_token=refresh_token,
    )


def login_with_google(credential: str) -> TokenResponse:
    payload = _decode_google_credential(credential)
    if not payload:
        raise ValueError("بيانات اعتماد Google غير صالحة")

    email = payload.get("email", "")
    name = payload.get("name", "")
    avatar = payload.get("picture", None)

    if not email:
        raise ValueError("لم يتم العثور على البريد الإلكتروني في بيانات Google")

    if email in _users_db:
        user = _users_db[email]
        user["avatar"] = avatar or user.get("avatar")
        user["provider"] = "google"
    else:
        user_id = f"google-{secrets.token_hex(8)}"
        now = datetime.now(UTC).isoformat()
        _users_db[email] = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": "",
            "avatar": avatar,
            "plan": "explorer",
            "provider": "google",
            "created_at": now,
        }

    user = _users_db[email]
    token = _create_token(
        user["id"],
        user["email"],
        user["name"],
        avatar=user.get("avatar"),
        plan=user.get("plan", "explorer"),
        provider="google",
    )
    return TokenResponse(
        token=token,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            avatar=user.get("avatar"),
            plan=user.get("plan", "explorer"),
            provider="google",
            created_at=user.get("created_at"),
        ),
    )


def verify_token(token: str) -> UserOut | None:
    payload = _decode_token(token)
    if not payload:
        return None
    return UserOut(
        id=payload.get("sub", ""),
        name=payload.get("name", ""),
        email=payload.get("email", ""),
        avatar=payload.get("avatar"),
        plan=payload.get("plan", "explorer"),
        provider=payload.get("provider", "email"),
    )


def get_user_profile(token: str) -> UserOut | None:
    payload = _decode_token(token)
    if not payload:
        return None
    email = payload.get("email", "")
    user = _users_db.get(email)
    if not user:
        return None
    return UserOut(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        avatar=user.get("avatar"),
        plan=user.get("plan", "explorer"),
        provider=user.get("provider", "email"),
        created_at=user.get("created_at"),
    )


def update_user_plan(token: str, new_plan: str) -> UserOut | None:
    payload = _decode_token(token)
    if not payload:
        return None
    email = payload.get("email", "")
    user = _users_db.get(email)
    if not user:
        return None
    user["plan"] = new_plan
    return UserOut(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        avatar=user.get("avatar"),
        plan=new_plan,
        provider=user.get("provider", "email"),
        created_at=user.get("created_at"),
    )


def refresh_access_token(refresh_token: str) -> TokenResponse:
    """
    Refresh access token using a valid refresh token.

    Args:
        refresh_token: Valid refresh token

    Returns:
        TokenResponse with new access token and same refresh token

    Raises:
        ValueError: If refresh token is invalid or expired
    """
    # Validate refresh token
    payload = _decode_token(refresh_token)
    if not payload:
        raise ValueError("Refresh token غير صالح أو منتهي الصلاحية")

    # Check token type
    if payload.get("type") != "refresh":
        raise ValueError("Token type غير صحيح")

    # Verify refresh token exists in storage
    if refresh_token not in _refresh_tokens:
        raise ValueError("Refresh token غير موجود")

    # Get user info
    email = payload.get("email", "")
    user = _users_db.get(email)
    if not user:
        raise ValueError("المستخدم غير موجود")

    # Create new access token
    new_access_token = _create_token(
        user["id"],
        user["email"],
        user["name"],
        avatar=user.get("avatar"),
        plan=user.get("plan", "explorer"),
        provider=user.get("provider", "email"),
    )

    return TokenResponse(
        token=new_access_token,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            avatar=user.get("avatar"),
            plan=user.get("plan", "explorer"),
            provider=user.get("provider", "email"),
            created_at=user.get("created_at"),
        ),
        refresh_token=refresh_token,  # Return the same refresh token
    )


def revoke_token(token: str) -> bool:
    """
    Revoke an access or refresh token.

    Args:
        token: Token to revoke

    Returns:
        True if token was revoked successfully, False otherwise
    """
    payload = _decode_token(token)
    if not payload:
        return False

    jti = payload.get("jti")
    if not jti:
        return False

    # Add to revocation list
    _revoked_tokens.add(jti)

    # If it's a refresh token, remove from storage
    token_type = payload.get("type", "access")
    if token_type == "refresh" and token in _refresh_tokens:
        del _refresh_tokens[token]

    return True


def logout_user(token: str) -> bool:
    """
    Logout user by revoking their tokens.

    Args:
        token: Access token

    Returns:
        True if logout was successful
    """
    return revoke_token(token)


def is_token_revoked(token: str) -> bool:
    """
    Check if a token has been revoked.

    Args:
        token: Token to check

    Returns:
        True if token is revoked, False otherwise
    """
    payload = _decode_token(token)
    if not payload:
        return True  # Invalid tokens are considered revoked

    jti = payload.get("jti")
    return jti in _revoked_tokens if jti else False


def cleanup_expired_tokens() -> dict[str, int]:
    """
    Clean up expired refresh tokens and revoked token IDs.
    Should be called periodically (e.g., via cron job).

    Returns:
        Statistics about cleaned tokens
    """
    now = time.time()
    cleaned_refresh = 0
    cleaned_revoked = 0

    # Clean expired refresh tokens
    expired_refresh_tokens = []
    for token, info in _refresh_tokens.items():
        payload = _decode_token(token)
        if not payload or payload.get("exp", 0) < now:
            expired_refresh_tokens.append(token)

    for token in expired_refresh_tokens:
        del _refresh_tokens[token]
        cleaned_refresh += 1

    # Clean old revoked token IDs (keep only recent ones)
    # In production, use Redis with TTL instead
    if len(_revoked_tokens) > 10000:
        # Keep only the most recent 5000
        tokens_to_keep = list(_revoked_tokens)[-5000:]
        cleaned_revoked = len(_revoked_tokens) - len(tokens_to_keep)
        _revoked_tokens.clear()
        _revoked_tokens.update(tokens_to_keep)

    return {
        "cleaned_refresh_tokens": cleaned_refresh,
        "cleaned_revoked_tokens": cleaned_revoked,
        "active_refresh_tokens": len(_refresh_tokens),
        "active_revoked_tokens": len(_revoked_tokens),
    }

