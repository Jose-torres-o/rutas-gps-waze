module {
  /// A route, tag or note identifier.
  public type RouteId = Nat;
  public type TagId = Nat;

  /// Milliseconds since the Unix epoch.
  public type Timestamp = Nat;

  /// A geographic coordinate pair (WGS84 decimal degrees).
  public type GeoPoint = {
    lat : Float;
    lng : Float;
  };

  /// A single timestamped point along a recorded route.
  public type PathPoint = {
    lat : Float;
    lng : Float;
    timestamp : Timestamp;
  };

  /// Supported modes of transport.
  public type TravelMode = {
    #car;
    #bus;
    #motorcycle;
    #bicycle;
    #walking;
  };
};
