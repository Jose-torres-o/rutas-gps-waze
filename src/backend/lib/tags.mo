import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/tags";

module {
  public type TagId = Types.TagId;
  public type Tag = Types.Tag;
  public type TagInput = Types.TagInput;
  public type TagUpdate = Types.TagUpdate;
  public type Timestamp = Types.Timestamp;

  /// List every tag owned by `caller`, newest first.
  public func listTags(tags : Map.Map<TagId, Tag>, caller : Principal) : [Tag] {
    let owned = tags.values().filter(func t = Principal.equal(t.owner, caller)).toArray();
    owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
  };

  /// Fetch a single tag owned by `caller`.
  public func getTag(tags : Map.Map<TagId, Tag>, caller : Principal, id : TagId) : ?Tag {
    switch (tags.get(id)) {
      case (?tag) {
        if (Principal.equal(tag.owner, caller)) { ?tag } else { null };
      };
      case null { null };
    };
  };

  /// Create a tag or note at an exact map point for `caller` and return its id.
  public func addTag(
    tags : Map.Map<TagId, Tag>,
    state : { var nextTagId : Nat },
    caller : Principal,
    input : TagInput,
    now : Timestamp,
  ) : TagId {
    let id = state.nextTagId;
    state.nextTagId := id + 1;
    tags.add(id, {
      id;
      owner = caller;
      category = input.category;
      note = input.note;
      lat = input.lat;
      lng = input.lng;
      createdAt = now;
    });
    id;
  };

  /// Edit an existing tag's category or note.
  public func updateTag(
    tags : Map.Map<TagId, Tag>,
    caller : Principal,
    id : TagId,
    update : TagUpdate,
  ) : ?Tag {
    switch (tags.get(id)) {
      case (?tag) {
        if (Principal.equal(tag.owner, caller)) {
          let updated : Tag = {
            id = tag.id;
            owner = tag.owner;
            category = update.category;
            note = update.note;
            lat = tag.lat;
            lng = tag.lng;
            createdAt = tag.createdAt;
          };
          tags.add(id, updated);
          ?updated;
        } else {
          null;
        };
      };
      case null { null };
    };
  };

  /// Delete a tag owned by `caller`.
  public func deleteTag(tags : Map.Map<TagId, Tag>, caller : Principal, id : TagId) : Bool {
    switch (tags.get(id)) {
      case (?tag) {
        if (Principal.equal(tag.owner, caller)) {
          tags.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };
};
