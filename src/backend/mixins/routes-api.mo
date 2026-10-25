import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import RoutesLib "../lib/routes";
import Types "../types/routes";

mixin (
  routes : Map.Map<Types.RouteId, Types.Route>,
  routeState : { var nextRouteId : Nat },
) {
  /// List the caller's saved routes.
  public query ({ caller }) func listRoutes() : async [Types.Route] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to view your routes");
    };
    RoutesLib.listRoutes(routes, caller);
  };

  /// Fetch one of the caller's saved routes by id.
  public query ({ caller }) func getRoute(id : Types.RouteId) : async ?Types.Route {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to view your routes");
    };
    RoutesLib.getRoute(routes, caller, id);
  };

  /// Save a newly recorded route and return its id.
  public shared ({ caller }) func addRoute(input : Types.RouteInput) : async Types.RouteId {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to save a route");
    };
    RoutesLib.addRoute(routes, routeState, caller, input);
  };

  /// Rename or change the travel mode of a saved route.
  public shared ({ caller }) func updateRoute(id : Types.RouteId, update : Types.RouteUpdate) : async ?Types.Route {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to edit a route");
    };
    RoutesLib.updateRoute(routes, caller, id, update);
  };

  /// Delete one of the caller's saved routes.
  public shared ({ caller }) func deleteRoute(id : Types.RouteId) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to delete a route");
    };
    RoutesLib.deleteRoute(routes, caller, id);
  };
};
