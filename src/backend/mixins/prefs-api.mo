import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import PrefsLib "../lib/prefs";
import Types "../types/prefs";

mixin (prefs : Map.Map<Principal, Types.UserPrefs>) {
  /// Read the caller's persisted travel mode.
  public query ({ caller }) func getTravelMode() : async Types.TravelMode {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to read your travel mode");
    };
    PrefsLib.getMode(prefs, caller);
  };

  /// Persist the caller's travel mode.
  public shared ({ caller }) func setTravelMode(mode : Types.TravelMode) : async Types.TravelMode {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to set your travel mode");
    };
    PrefsLib.setMode(prefs, caller, mode);
  };
};
