def min_bundles(sizes: list[int], target: int) -> dict[int, int] | None:
    """
    Exactly `target` seat pete shobcheye kom bundle.
    Return: {size: koyta}. Exact combination na thakle None.
    """
    INF = target + 1
    dp = [INF] * (target + 1)
    choice = [0] * (target + 1)
    dp[0] = 0

    for n in range(1, target + 1):
        for s in sizes:
            if s <= n and dp[n - s] + 1 < dp[n]:
                dp[n] = dp[n - s] + 1
                choice[n] = s

    if dp[target] >= INF:
        return None

    counts: dict[int, int] = {}
    n = target
    while n > 0:
        s = choice[n]
        counts[s] = counts.get(s, 0) + 1
        n -= s

    return counts