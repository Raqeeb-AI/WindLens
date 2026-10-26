from enum import Enum

class SelectionStatus(str, Enum):
    SELECTED = "SELECTED"
    UNAVAILABLE = "UNAVAILABLE"
    STALE = "STALE"

class ErrorDirection(str, Enum):
    OVERFORECAST = "OVERFORECAST"   # Forecast > Actual
    UNDERFORECAST = "UNDERFORECAST" # Forecast < Actual
    EXACT = "EXACT"                 # Forecast == Actual

class BaselineMethod(str, Enum):
    DAY_AHEAD_PERSISTENCE = "DAY_AHEAD_PERSISTENCE"
    SEVEN_DAY_PERSISTENCE = "SEVEN_DAY_PERSISTENCE"
