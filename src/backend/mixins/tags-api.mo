import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import TagsLib "../lib/tags";
import Types "../types/tags";

mixin (
  tags : Map.Map<Types.TagId, Types.Tag>,
  tagState : { var nextTagId : Nat },
) {
  /// List the caller's tags and notes.
  public query ({ caller }) func listTags() : async [Types.Tag] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to view your tags");
    };
    TagsLib.listTags(tags, caller);
  };

  /// Fetch one of the caller's tags by id.
  public query ({ caller }) func getTag(id : Types.TagId) : async ?Types.Tag {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to view your tags");
    };
    TagsLib.getTag(tags, caller, id);
  };

  /// Create a tag or note at an exact map point and return its id.
  public shared ({ caller }) func addTag(input : Types.TagInput) : async Types.TagId {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to add a tag");
    };
    TagsLib.addTag(tags, tagState, caller, input, Int.abs(Time.now()));
  };

  /// Edit an existing tag's category or note.
  public shared ({ caller }) func updateTag(id : Types.TagId, update : Types.TagUpdate) : async ?Types.Tag {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to edit a tag");
    };
    TagsLib.updateTag(tags, caller, id, update);
  };

  /// Delete one of the caller's tags.
  public shared ({ caller }) func deleteTag(id : Types.TagId) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to delete a tag");
    };
    TagsLib.deleteTag(tags, caller, id);
  };
};
