import re
import calendar
import dateparser
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta

# Known Departments mapped to correct casing
DEPARTMENTS_MAP = {
    "dg office": "DG Office",
    "cid crime": "CID Crime",
    "law & order":
     "Law & Order",
    "training": "Training",
    "ts & scrb": "TS & SCRB",
    "sp office": "SP Office",
    "control room": "Control Room",
    "hq": "HQ",
    "fsl": "FSL"
}

# Action synonyms mapping
ACTION_MAP = {
    "received": "received",
    "inward": "received",
    "forwarded": "forwarded",
    "sent": "forwarded",
    "closed": "closed",
    "pending": "pending",
    "acknowledged": "acknowledged"
}

MODE_MAP = {
    "physical": "Physical",
    "fax": "Fax",
    "email": "Mails",
    "mails": "Mails"
}

PRIORITY_MAP = {
    "urgent": "Urgent",
    "confidential": "Confidential",
    "normal": "Normal"
}

def parse_smart_query(query: str) -> Dict[str, Any]:
    """
    Parses a natural language query and extracts filters for DB searching.
    """
    query_clean = query.strip().lower()
    
    intent = {
        "department": None,
        "action": None,
        "date_start": None,
        "date_end": None,
        "priority": None,
        "mode": None,
        "queryType": "list", # default
        "raw_date_str": None,
        "raw_department": None,
        "raw_action": None,
        "raw_priority": None,
        "raw_mode": None
    }
    
    # 1. Detect queryType (count vs list)
    if re.search(r'\b(how many|count|total|statistics|number of)\b', query_clean):
        intent["queryType"] = "count"
        
    # 2. Detect Department
    for key, dept in DEPARTMENTS_MAP.items():
        if key in query_clean:
            intent["department"] = dept
            intent["raw_department"] = dept
            break
            
    # 3. Detect Action
    for key, val in ACTION_MAP.items():
        if re.search(rf'\b{key}\b', query_clean):
            intent["action"] = val
            intent["raw_action"] = val.capitalize()
            break
            
    # 4. Detect Priority
    for key, val in PRIORITY_MAP.items():
        if re.search(rf'\b{key}\b', query_clean):
            intent["priority"] = val
            intent["raw_priority"] = val
            break
            
    # 5. Detect Mode
    for key, val in MODE_MAP.items():
        if re.search(rf'\b{key}\b', query_clean):
            intent["mode"] = val
            intent["raw_mode"] = val
            break
            
    # 6. Detect Dates
    date_patterns = [
        r'\b(?:on|in|from|since|for)?\s*(today|yesterday|this week|last week|this month|last month)\b',
        r'\b(?:on|in)?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?)\b',
        r'\b(?:in)?\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})\b',
        r'\b(\d{1,2}[-\./]\d{1,2}[-\./]\d{2,4})\b',
        r'\b(20\d{2})\b'
    ]
    
    extracted_date_str = None
    for pattern in date_patterns:
        match = re.search(pattern, query_clean)
        if match:
            extracted_date_str = match.group(1).strip()
            intent["raw_date_str"] = extracted_date_str
            break
            
    if extracted_date_str:
        start_date, end_date = _parse_date_range(extracted_date_str)
        if start_date and end_date:
            intent["date_start"] = start_date
            intent["date_end"] = end_date
            intent["raw_date_str"] = extracted_date_str.title()
        else:
            intent["raw_date_str"] = None
        
    return intent

def _parse_date_range(date_str: str) -> Tuple[datetime, datetime]:
    date_str = date_str.lower()
    now = datetime.now()
    
    if date_str == 'today':
        return now.replace(hour=0,minute=0,second=0,microsecond=0), now.replace(hour=23,minute=59,second=59,microsecond=999999)
    elif date_str == 'yesterday':
        yest = now - timedelta(days=1)
        return yest.replace(hour=0,minute=0,second=0,microsecond=0), yest.replace(hour=23,minute=59,second=59,microsecond=999999)
    elif date_str == 'this week':
        start = now - timedelta(days=now.weekday())
        end = start + timedelta(days=6)
        return start.replace(hour=0,minute=0,second=0,microsecond=0), end.replace(hour=23,minute=59,second=59,microsecond=999999)
    elif date_str == 'last week':
        start = now - timedelta(days=now.weekday() + 7)
        end = start + timedelta(days=6)
        return start.replace(hour=0,minute=0,second=0,microsecond=0), end.replace(hour=23,minute=59,second=59,microsecond=999999)
    elif date_str == 'this month':
        start = now.replace(day=1, hour=0,minute=0,second=0,microsecond=0)
        last_day = calendar.monthrange(now.year, now.month)[1]
        end = now.replace(day=last_day, hour=23,minute=59,second=59,microsecond=999999)
        return start, end
    elif date_str == 'last month':
        first_day_this_month = now.replace(day=1)
        last_month = first_day_this_month - timedelta(days=1)
        start = last_month.replace(day=1, hour=0,minute=0,second=0,microsecond=0)
        end = last_month.replace(hour=23,minute=59,second=59,microsecond=999999)
        return start, end
    elif re.match(r'^\d{4}$', date_str):
        year = int(date_str)
        return datetime(year, 1, 1), datetime(year, 12, 31, 23, 59, 59, 999999)
    
    parsed = dateparser.parse(date_str, settings={'TIMEZONE': 'UTC', 'PREFER_DAY_OF_MONTH': 'first'})
    if parsed:
        if re.match(r'^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}$', date_str):
            start = parsed.replace(day=1, hour=0,minute=0,second=0,microsecond=0)
            last_day = calendar.monthrange(start.year, start.month)[1]
            end = start.replace(day=last_day, hour=23,minute=59,second=59,microsecond=999999)
            return start, end
        else:
            return parsed.replace(hour=0,minute=0,second=0,microsecond=0), parsed.replace(hour=23,minute=59,second=59,microsecond=999999)
            
    return None, None
