import Common "common";

module {
  public type TravelMode = Common.TravelMode;

  /// Per-user persisted preferences.
  public type UserPrefs = {
    mode : TravelMode;
  };
};
