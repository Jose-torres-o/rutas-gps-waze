import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import RoutesApi "mixins/routes-api";
import TagsApi "mixins/tags-api";
import PrefsApi "mixins/prefs-api";
import ApiDocMixin "mixins/api-doc";
import RouteTypes "types/routes";
import TagTypes "types/tags";
import PrefTypes "types/prefs";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let routes : Map.Map<RouteTypes.RouteId, RouteTypes.Route>;
  let routeState : { var nextRouteId : Nat };
  let tags : Map.Map<TagTypes.TagId, TagTypes.Tag>;
  let tagState : { var nextTagId : Nat };
  let prefs : Map.Map<Principal, PrefTypes.UserPrefs>;

  include MixinAuthorization(accessControlState, null);
  include RoutesApi(routes, routeState);
  include TagsApi(tags, tagState);
  include PrefsApi(prefs);
  include ApiDocMixin();

  func modeToText(mode : RouteTypes.TravelMode) : Text {
    switch (mode) {
      case (#car) { "car" };
      case (#bus) { "bus" };
      case (#motorcycle) { "motorcycle" };
      case (#bicycle) { "bicycle" };
      case (#walking) { "walking" };
    };
  };

  func categoryToText(category : TagTypes.TagCategory) : Text {
    switch (category) {
      case (#pothole) { "pothole" };
      case (#hazard) { "hazard" };
      case (#speedCamera) { "speedCamera" };
      case (#trafficSignal) { "trafficSignal" };
      case (#note) { "note" };
    };
  };

  include Expose({
    entities = [
      routes.toEntityManual("route", "Route", "id")
        .sample({
          id = 0;
          owner = Principal.fromText("aaaaa-aa");
          name = "";
          distanceMeters = 0.0;
          durationSeconds = 0;
          startedAt = 0;
          endedAt = 0;
          mode = #car;
          points = [];
        })
        .payload("id", func r = r.id)
        .payload("owner", func r = r.owner)
        .payload("name", func r = r.name)
        .payload("distanceMeters", func r = r.distanceMeters)
        .payload("durationSeconds", func r = r.durationSeconds)
        .payload("startedAt", func r = r.startedAt)
        .payload("endedAt", func r = r.endedAt)
        .payload("mode", func r = modeToText(r.mode))
        .payload("pointCount", func r = r.points.size())
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      tags.toEntityManual("tag", "Tag", "id")
        .sample({
          id = 0;
          owner = Principal.fromText("aaaaa-aa");
          category = #note;
          note = "";
          lat = 0.0;
          lng = 0.0;
          createdAt = 0;
        })
        .payload("id", func t = t.id)
        .payload("owner", func t = t.owner)
        .payload("category", func t = categoryToText(t.category))
        .payload("note", func t = t.note)
        .payload("lat", func t = t.lat)
        .payload("lng", func t = t.lng)
        .payload("createdAt", func t = t.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
