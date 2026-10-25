import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type OldActor = {};

  type PathPoint = { lat : Float; lng : Float; timestamp : Nat };
  type TravelMode = { #car; #bus; #motorcycle; #bicycle; #walking };
  type Route = {
    id : Nat;
    owner : Principal;
    name : Text;
    distanceMeters : Float;
    durationSeconds : Nat;
    startedAt : Nat;
    endedAt : Nat;
    mode : TravelMode;
    points : [PathPoint];
  };
  type TagCategory = { #pothole; #hazard; #speedCamera; #trafficSignal; #note };
  type Tag = {
    id : Nat;
    owner : Principal;
    category : TagCategory;
    note : Text;
    lat : Float;
    lng : Float;
    createdAt : Nat;
  };
  type UserPrefs = { mode : TravelMode };

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    routes : Map.Map<Nat, Route>;
    routeState : { var nextRouteId : Nat };
    tags : Map.Map<Nat, Tag>;
    tagState : { var nextTagId : Nat };
    prefs : Map.Map<Principal, UserPrefs>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      routes = Map.empty();
      routeState = { var nextRouteId = 0 };
      tags = Map.empty();
      tagState = { var nextTagId = 0 };
      prefs = Map.empty();
    };
  };
};
