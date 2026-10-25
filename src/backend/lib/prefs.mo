import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/prefs";

module {
  public type UserPrefs = Types.UserPrefs;
  public type TravelMode = Types.TravelMode;

  /// Read the persisted travel mode for `caller`, defaulting to #car.
  public func getMode(prefs : Map.Map<Principal, UserPrefs>, caller : Principal) : TravelMode {
    switch (prefs.get(caller)) {
      case (?p) { p.mode };
      case null { #car };
    };
  };

  /// Persist the travel mode for `caller`.
  public func setMode(prefs : Map.Map<Principal, UserPrefs>, caller : Principal, mode : TravelMode) : TravelMode {
    prefs.add(caller, { mode });
    mode;
  };
};
