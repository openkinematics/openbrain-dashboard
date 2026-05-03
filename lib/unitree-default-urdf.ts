/**
 * Default offline URDF preview: Unitree H2 humanoid from upstream unitree_ros.
 * Meshes resolve relative to {@link UNITREE_H2_URDF_WORKING_PATH}.
 *
 * @see https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h2_description
 */

export const UNITREE_ROS_REPO_URL = "https://github.com/unitreerobotics/unitree_ros";

/** Directory listing for H2 URDF + mesh assets. */
export const UNITREE_H2_DESCRIPTION_TREE_URL =
  "https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h2_description";

/** Raw `H2_dae.urdf` (Collada visuals; matches relative `meshes/*.dae` paths). */
export const UNITREE_H2_URDF_RAW_URL =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/h2_description/H2_dae.urdf";

/** Must end with `/` for urdf-loader relative mesh paths. */
export const UNITREE_H2_URDF_WORKING_PATH =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/h2_description/";

/** Unitree G1 humanoid (`meshes/*.STL` paths relative to this folder). */
export const UNITREE_G1_DESCRIPTION_TREE_URL =
  "https://github.com/unitreerobotics/unitree_ros/tree/master/robots/g1_description";

export const UNITREE_G1_URDF_RAW_URL =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/g1_description/g1_23dof.urdf";

/** Must end with `/` for urdf-loader relative mesh paths. */
export const UNITREE_G1_URDF_WORKING_PATH =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/g1_description/";

/** Unitree Go2 quadruped (`package://go2_description/...` meshes). */
export const UNITREE_GO2_DESCRIPTION_TREE_URL =
  "https://github.com/unitreerobotics/unitree_ros/tree/master/robots/go2_description";

export const UNITREE_GO2_URDF_RAW_URL =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/go2_description/urdf/go2_description.urdf";

/**
 * Base URL for `package://go2_description/…` resolution (no trailing slash;
 * urdf-loader joins `/` + relative path).
 */
export const UNITREE_GO2_PACKAGE_ROOT =
  "https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/go2_description";
