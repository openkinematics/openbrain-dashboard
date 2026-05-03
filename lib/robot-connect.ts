"use client";

import { setRosbridgeUrl, setVideoBaseUrl } from "@/lib/env";
import { appendActivity, rememberRobot, setSelectedRobotId } from "@/lib/preferences";
import { connect } from "@/lib/ros";
import type { FleetRobot } from "@/lib/types";

/** Persist endpoints and selected fleet id; does not open the socket. */
export function applyRobotEndpoints(robot: FleetRobot) {
  setRosbridgeUrl(robot.rosbridgeUrl);
  setVideoBaseUrl(robot.videoBaseUrl);
  rememberRobot(robot.rosbridgeUrl);
  setSelectedRobotId(robot.id);
}

/** Apply endpoints + reconnect rosbridge. */
export async function connectFleetRobot(robot: FleetRobot, force = true) {
  applyRobotEndpoints(robot);
  return connect(robot.rosbridgeUrl, force);
}

export function logFleetConnectSuccess(robot: FleetRobot) {
  appendActivity("connect", `Connected to ${robot.name}`);
}

export function logFleetAction(message: string) {
  appendActivity("fleet", message);
}
