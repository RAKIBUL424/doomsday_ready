def would_create_cycle(
    movie_id: int,
    new_prerequisite_ids: list[int],
    graph: dict[int, list[int]],
) -> bool:
    """
    graph[a] = [b, c] mane a dekhar age b ar c dekha lagbe.
    New prerequisite gulo theke prerequisite-er pothe hete dekhthe hobe je target movie_id e pouchale cycle hobe kina. Pouchale loop.
    Target movie_id e pouchale cycle hobe kina check kore. Pouchale loop.
    Return: True jodi cycle thake, False jodi target movie_id e pouchale cycle na thake.
    """
    stack = list(new_prerequisite_ids)
    seen: set[int] = set()

    while stack:
        current = stack.pop()
        if current == movie_id:
            return True
        if current in seen:
            continue
        seen.add(current)
        stack.extend(graph.get(current, []))

    return False



def rewatch_order(target_id: int, graph: dict[int, list[int]]) -> list[int]:
    """
    graph[a] = [b, c] mane a dekhar age b ar c dekha lagbe.
    Target er sob prerequisite (prerequisite er prerequisite shoho)
    ekbar kore, prerequisite age rekhe return kore. Target nijei bad.
    """
    order: list[int] = []
    visited: set[int] = {target_id}

    # stack e (movie, next kon prerequisite dekhte hobe tar index) rakhi
    stack: list[tuple[int, int]] = [(target_id, 0)]

    while stack:
        node, i = stack.pop()
        prereqs = graph.get(node, [])

        if i < len(prereqs):
            # ei node e ekhono prerequisite baki, ager jaygay ferot ashar jonno rakhi
            stack.append((node, i + 1))
            nxt = prereqs[i]
            if nxt not in visited:
                visited.add(nxt)
                stack.append((nxt, 0))
        else:
            # ei node er shob prerequisite shesh, ebar node ta add kori
            if node != target_id:
                order.append(node)

    return order