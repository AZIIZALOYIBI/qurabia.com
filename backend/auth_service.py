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

_jwt_secret = os.environ.get("JWT_SECRET", "")
if not _jwt_secret:
    _jwt_secret = hashlib.sha256(
        (os.environ.get("KEM_MASTER_SEED", "dev-seed") + "qurabia-auth-2026").encode()
    ).hexdigest()


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


_users_db: dict[str, dict] = {}


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(
    user_id: str, email: str, name: str, avatar: str | None = None, plan: str = "explorer", provider: str = "email"
) -> str:
    expire = time.time() + ACCESS_TOKEN_EXPIRE_HOURS * 3600
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "avatar": avatar,
        "plan": plan,
        "provider": provider,
        "exp": expire,
    }
    return jwt.encode(payload, _jwt_secret, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _jwt_secret, algorithms=[ALGORITHM])
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
    return TokenResponse(
        token=token,
        user=UserOut(id=user_id, name=name, email=email, plan="explorer", provider="email", created_at=now),
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
