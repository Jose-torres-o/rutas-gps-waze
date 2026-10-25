import Common "common";

module {
  public type TagId = Common.TagId;
  public type Timestamp = Common.Timestamp;
  public type GeoPoint = Common.GeoPoint;

  /// Category of a street tag or note.
  public type TagCategory = {
    #pothole;
    #hazard;
    #speedCamera;
    #trafficSignal;
    #note;
  };

  /// A user-placed tag or note at an exact map point.
  public type Tag = {
    id : TagId;
    owner : Principal;
    category : TagCategory;
    note : Text;
    lat : Float;
    lng : Float;
    createdAt : Timestamp;
  };

  /// Input payload for creating a tag or note.
  public type TagInput = {
    category : TagCategory;
    note : Text;
    lat : Float;
    lng : Float;
  };

  /// Input payload for editing an existing tag or note.
  public type TagUpdate = {
    category : TagCategory;
    note : Text;
  };
};
