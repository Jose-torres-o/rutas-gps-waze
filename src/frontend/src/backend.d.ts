import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface PathPoint {
    lat: number;
    lng: number;
    timestamp: Timestamp;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Route {
    id: RouteId;
    startedAt: Timestamp;
    owner: Principal;
    endedAt: Timestamp;
    mode: TravelMode;
    name: string;
    durationSeconds: bigint;
    distanceMeters: number;
    points: Array<PathPoint>;
}
export type RouteId = bigint;
export interface RouteInput {
    startedAt: Timestamp;
    endedAt: Timestamp;
    mode: TravelMode;
    name: string;
    durationSeconds: bigint;
    distanceMeters: number;
    points: Array<PathPoint>;
}
export interface RouteUpdate {
    mode: TravelMode;
    name: string;
}
export interface Tag {
    id: TagId;
    lat: number;
    lng: number;
    owner: Principal;
    note: string;
    createdAt: Timestamp;
    category: TagCategory;
}
export type TagId = bigint;
export interface TagInput {
    lat: number;
    lng: number;
    note: string;
    category: TagCategory;
}
export interface TagUpdate {
    note: string;
    category: TagCategory;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum TagCategory {
    note = "note",
    pothole = "pothole",
    hazard = "hazard",
    trafficSignal = "trafficSignal",
    speedCamera = "speedCamera"
}
export enum TravelMode {
    bus = "bus",
    car = "car",
    motorcycle = "motorcycle",
    bicycle = "bicycle",
    walking = "walking"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Save a newly recorded route and return its id.
     */
    addRoute(input: RouteInput): Promise<RouteId>;
    /**
     * / Create a tag or note at an exact map point and return its id.
     */
    addTag(input: TagInput): Promise<TagId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Delete one of the caller's saved routes.
     */
    deleteRoute(id: RouteId): Promise<boolean>;
    /**
     * / Delete one of the caller's tags.
     */
    deleteTag(id: TagId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch one of the caller's saved routes by id.
     */
    getRoute(id: RouteId): Promise<Route | null>;
    /**
     * / Fetch one of the caller's tags by id.
     */
    getTag(id: TagId): Promise<Tag | null>;
    /**
     * / Read the caller's persisted travel mode.
     */
    getTravelMode(): Promise<TravelMode>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's saved routes.
     */
    listRoutes(): Promise<Array<Route>>;
    /**
     * / List the caller's tags and notes.
     */
    listTags(): Promise<Array<Tag>>;
    schema(): Promise<string>;
    /**
     * / Persist the caller's travel mode.
     */
    setTravelMode(mode: TravelMode): Promise<TravelMode>;
    /**
     * / Rename or change the travel mode of a saved route.
     */
    updateRoute(id: RouteId, update: RouteUpdate): Promise<Route | null>;
    /**
     * / Edit an existing tag's category or note.
     */
    updateTag(id: TagId, update: TagUpdate): Promise<Tag | null>;
}
