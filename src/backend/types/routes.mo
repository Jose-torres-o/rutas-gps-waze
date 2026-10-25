import Common "common";

module {
  public type RouteId = Common.RouteId;
  public type Timestamp = Common.Timestamp;
  public type PathPoint = Common.PathPoint;
  public type TravelMode = Common.TravelMode;

  /// A recorded route owned by a single user.
  public type Route = {
    id : RouteId;
    owner : Principal;
    name : Text;
    distanceMeters : Float;
    durationSeconds : Nat;
    startedAt : Timestamp;
    endedAt : Timestamp;
    mode : TravelMode;
    points : [PathPoint];
  };

  /// Input payload for saving a newly recorded route.
  public type RouteInput = {
    name : Text;
    distanceMeters : Float;
    durationSeconds : Nat;
    startedAt : Timestamp;
    endedAt : Timestamp;
    mode : TravelMode;
    points : [PathPoint];
  };

  /// Input payload for editing an existing route's metadata.
  public type RouteUpdate = {
    name : Text;
    mode : TravelMode;
  };
};
