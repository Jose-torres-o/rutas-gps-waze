import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/routes";

module {
  public type RouteId = Types.RouteId;
  public type Route = Types.Route;
  public type RouteInput = Types.RouteInput;
  public type RouteUpdate = Types.RouteUpdate;

  /// List every route owned by `caller`, newest first.
  public func listRoutes(routes : Map.Map<RouteId, Route>, caller : Principal) : [Route] {
    let owned = routes.values().filter(func r = Principal.equal(r.owner, caller)).toArray();
    owned.sort(func (a, b) = if (a.startedAt > b.startedAt) { #less } else if (a.startedAt < b.startedAt) { #greater } else { #equal });
  };

  /// Fetch a single route owned by `caller`.
  public func getRoute(routes : Map.Map<RouteId, Route>, caller : Principal, id : RouteId) : ?Route {
    switch (routes.get(id)) {
      case (?route) {
        if (Principal.equal(route.owner, caller)) { ?route } else { null };
      };
      case null { null };
    };
  };

  /// Persist a newly recorded route for `caller` and return its id.
  public func addRoute(
    routes : Map.Map<RouteId, Route>,
    state : { var nextRouteId : Nat },
    caller : Principal,
    input : RouteInput,
  ) : RouteId {
    let id = state.nextRouteId;
    state.nextRouteId := id + 1;
    routes.add(id, {
      id;
      owner = caller;
      name = input.name;
      distanceMeters = input.distanceMeters;
      durationSeconds = input.durationSeconds;
      startedAt = input.startedAt;
      endedAt = input.endedAt;
      mode = input.mode;
      points = input.points;
    });
    id;
  };

  /// Rename or re-mode an existing route owned by `caller`.
  public func updateRoute(
    routes : Map.Map<RouteId, Route>,
    caller : Principal,
    id : RouteId,
    update : RouteUpdate,
  ) : ?Route {
    switch (routes.get(id)) {
      case (?route) {
        if (Principal.equal(route.owner, caller)) {
          let updated : Route = {
            id = route.id;
            owner = route.owner;
            name = update.name;
            distanceMeters = route.distanceMeters;
            durationSeconds = route.durationSeconds;
            startedAt = route.startedAt;
            endedAt = route.endedAt;
            mode = update.mode;
            points = route.points;
          };
          routes.add(id, updated);
          ?updated;
        } else {
          null;
        };
      };
      case null { null };
    };
  };

  /// Delete a route owned by `caller`.
  public func deleteRoute(routes : Map.Map<RouteId, Route>, caller : Principal, id : RouteId) : Bool {
    switch (routes.get(id)) {
      case (?route) {
        if (Principal.equal(route.owner, caller)) {
          routes.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };
};
