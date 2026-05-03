// Shared types for ROS message payloads we touch.
//
// These mirror the OpenBrain ROS API contract. We only declare the fields we
// actually use — full message definitions live in `openbrain_msgs`.

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface TwistMsg {
  linear: Vector3;
  angular: Vector3;
}

export interface PoseMsg {
  position: Vector3;
  orientation: Quaternion;
}

export interface PoseStampedMsg {
  header: { stamp: { sec: number; nanosec: number }; frame_id: string };
  pose: PoseMsg;
}

export interface OdometryMsg {
  header: { stamp: { sec: number; nanosec: number }; frame_id: string };
  child_frame_id: string;
  pose: { pose: PoseMsg };
  twist: { twist: TwistMsg };
}

export interface OccupancyGridMsg {
  header: { stamp: { sec: number; nanosec: number }; frame_id: string };
  info: {
    resolution: number;
    width: number;
    height: number;
    origin: PoseMsg;
  };
  data: number[];
}

export interface SystemHealthMsg {
  cpu_per_core: number[]; // 0..100
  cpu_temp_c: number;
  gpu_percent: number;
  gpu_temp_c: number;
  ram_used_bytes: number;
  ram_total_bytes: number;
  thermal_zones: { name: string; temp_c: number }[];
  power_rails: { name: string; voltage_v: number; current_a: number }[];
  uptime_s: number;
}

export type SpeedProfile = "beginner" | "normal" | "insane";

/** Cockpit 3D preview: live ROS topic vs bundled Unitree models vs local file. */
export type UrdfPreviewSource = "humanoid_g1" | "humanoid_h2" | "dog" | "ros" | "upload";

export interface SetSpeedProfileRequest {
  profile: SpeedProfile;
}

export interface SetSpeedProfileResponse {
  success: boolean;
  message?: string;
}

export interface LoadMissionWaypoint {
  x: number;
  y: number;
  yaw: number;
}

export interface LoadMissionRequest {
  waypoints: LoadMissionWaypoint[];
  loop: boolean;
}

export interface LoadMissionResponse {
  success: boolean;
  message?: string;
}

export interface TriggerResponse {
  success: boolean;
  message?: string;
}

/** Saved robot entry for local-first Fleet (no cloud). */
export interface FleetRobot {
  id: string;
  name: string;
  rosbridgeUrl: string;
  videoBaseUrl: string;
  /** Only one favorite at a time; drives default connect target. */
  isFavorite: boolean;
}

/** Lightweight audit trail in localStorage for the home dashboard. */
export interface ActivityEntry {
  id: string;
  at: number;
  kind: "connect" | "fleet" | "maps" | "settings" | "mission" | "other";
  message: string;
}

/** Teleop / stream preferences (Settings page). */
export type VideoTransportPreference = "auto" | "webrtc" | "mjpeg";

export type CameraOverlayColor = "white" | "black" | "red" | "purple" | "blue" | "green";

export interface DashboardSettings {
  invertJoystickLR: boolean;
  /** When true, joystick UI moves but no /cmd_vel is sent. */
  joystickVisualizationOnly: boolean;
  /** Gamepad axis indices (standard mapping: 0=LX, 1=LY, 2=RX, 3=RY). */
  gamepadAngularAxisIndex: number;
  gamepadLinearAxisIndex: number;
  videoTransport: VideoTransportPreference;
  overlayColor: CameraOverlayColor;
}

/** Bump when default positions or widget set changes (invalidates saved layouts). */
export const COCKPIT_MY_UI_LAYOUT_VERSION = 1;

export const COCKPIT_MY_UI_BREAKPOINTS = ["lg", "md", "sm", "xs"] as const;
export type CockpitMyUiBreakpoint = (typeof COCKPIT_MY_UI_BREAKPOINTS)[number];

export type CockpitMyUiWidgetId = "robotModel" | "cameraFront" | "cameraBack" | "drive" | "map";

/** Serializable grid item (react-grid-layout compatible). */
export interface CockpitMyUiLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

/** Saved My UI / Cockpit drag-drop layout per breakpoint. */
export interface CockpitMyUILayout {
  version: number;
  layouts: Record<CockpitMyUiBreakpoint, CockpitMyUiLayoutItem[]>;
}

/** OpenBrain mapping services exposed by bot_localization_interfaces. */
export interface MappingServiceResponse {
  success: boolean;
  message?: string;
  db_files?: string[];
}

export interface LoadDatabaseRequest {
  database_path: string;
  clear_db: boolean;
}

export interface SetMappingRequest {
  database_path: string;
  clear_db: boolean;
}

export interface DeleteDatabaseRequest {
  database_path: string;
}
