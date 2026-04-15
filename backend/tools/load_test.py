import argparse
import asyncio
import statistics
import time
from dataclasses import dataclass

import httpx


@dataclass
class Stats:
    ok: int
    failed: int
    p50_ms: float
    p95_ms: float
    avg_ms: float
    rps: float


def _percentile_ms(samples_ms: list[float], p: float) -> float:
    if not samples_ms:
        return 0.0
    xs = sorted(samples_ms)
    k = int(round((len(xs) - 1) * p))
    k = max(0, min(k, len(xs) - 1))
    return float(xs[k])


async def _run_once(client: httpx.AsyncClient, url: str) -> tuple[bool, float]:
    start = time.perf_counter()
    try:
        r = await client.get(url)
        ok = 200 <= r.status_code < 300
    except Exception:
        ok = False
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return ok, elapsed_ms


async def _scenario(base_url: str, path: str, total_requests: int, concurrency: int, timeout_s: float) -> Stats:
    url = base_url.rstrip("/") + path
    limits = httpx.Limits(max_connections=concurrency, max_keepalive_connections=concurrency)
    timeout = httpx.Timeout(timeout_s)
    samples_ms: list[float] = []
    ok = 0
    failed = 0

    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        sem = asyncio.Semaphore(concurrency)
        start_all = time.perf_counter()

        async def worker() -> None:
            nonlocal ok, failed
            async with sem:
                success, ms = await _run_once(client, url)
                samples_ms.append(ms)
                if success:
                    ok += 1
                else:
                    failed += 1

        await asyncio.gather(*[worker() for _ in range(total_requests)])
        elapsed = time.perf_counter() - start_all

    avg_ms = statistics.mean(samples_ms) if samples_ms else 0.0
    p50_ms = _percentile_ms(samples_ms, 0.50)
    p95_ms = _percentile_ms(samples_ms, 0.95)
    rps = (total_requests / elapsed) if elapsed > 0 else 0.0
    return Stats(ok=ok, failed=failed, p50_ms=p50_ms, p95_ms=p95_ms, avg_ms=avg_ms, rps=rps)


def _print(title: str, stats: Stats) -> None:
    print(f"{title}")
    print(f"  ok={stats.ok} failed={stats.failed} rps={stats.rps:.2f}")
    print(f"  p50={stats.p50_ms:.1f}ms p95={stats.p95_ms:.1f}ms avg={stats.avg_ms:.1f}ms")


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8000")
    parser.add_argument("--requests", type=int, default=300)
    parser.add_argument("--timeout", type=float, default=8.0)
    parser.add_argument("--concurrency", type=int, nargs="*", default=[1, 5, 20])
    args = parser.parse_args()

    scenarios: list[tuple[str, str]] = [
        ("Health", "/health"),
        ("Learning summary", "/api/learning/summary?top=6"),
    ]

    for name, path in scenarios:
        for c in args.concurrency:
            stats = await _scenario(args.base, path, total_requests=args.requests, concurrency=c, timeout_s=args.timeout)
            _print(f"{name}  (c={c}, n={args.requests})", stats)


if __name__ == "__main__":
    asyncio.run(main())

