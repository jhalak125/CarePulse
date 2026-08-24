from datetime import datetime, timedelta

def parse_time_to_minutes(time_str: str) -> int:
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def format_minutes_to_time(total_minutes: int) -> str:
    hours = total_minutes // 60
    mins = total_minutes % 60
    return f"{hours:02d}:{mins:02d}"

def get_day_name(date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return dt.strftime("%A")

def is_date_in_range(date_str: str, start_date_str: str, end_date_str: str) -> bool:
    target = datetime.strptime(date_str, "%Y-%m-%d")
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    end = datetime.strptime(end_date_str, "%Y-%m-%d")
    return start <= target <= end

def generate_discrete_slots(
    working_start: str = "09:00",
    working_end: str = "17:00",
    break_start: str = "13:00",
    break_end: str = "14:00",
    slot_duration_minutes: int = 30
):
    w_start = parse_time_to_minutes(working_start)
    w_end = parse_time_to_minutes(working_end)
    b_start = parse_time_to_minutes(break_start) if break_start else None
    b_end = parse_time_to_minutes(break_end) if break_end else None

    slots = []
    curr = w_start

    while curr + slot_duration_minutes <= w_end:
        slot_end = curr + slot_duration_minutes
        
        # Skip break times
        if b_start is not None and b_end is not None:
            if not (slot_end <= b_start or curr >= b_end):
                curr = b_end
                continue

        slots.append({
            "startTime": format_minutes_to_time(curr),
            "endTime": format_minutes_to_time(slot_end)
        })
        curr = slot_end

    return slots
