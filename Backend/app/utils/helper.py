from datetime import date


def calculate_fine(due_date_str: str, fine_per_day: float = 5.0) -> float:
    """
    Calculate overdue fine.

    Args:
        due_date_str: ISO date string, e.g. "2025-08-01"
        fine_per_day:  Amount charged per overdue day (default ₹5).

    Returns:
        Fine amount (0.0 if not yet overdue or date is invalid).
    """
    try:
        due_date = date.fromisoformat(due_date_str)
        today = date.today()
        if today > due_date:
            overdue_days = (today - due_date).days
            return round(overdue_days * fine_per_day, 2)
    except (ValueError, TypeError):
        pass
    return 0.0


def is_overdue(due_date_str: str) -> bool:
    """Return True if the given due date is in the past."""
    try:
        return date.today() > date.fromisoformat(due_date_str)
    except (ValueError, TypeError):
        return False