"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Box, Loader2, Upload } from "lucide-react";
import { useTopic } from "@/components/ros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNITREE_GO2_PACKAGE_ROOT,
  UNITREE_GO2_URDF_RAW_URL,
  UNITREE_G1_URDF_RAW_URL,
  UNITREE_G1_URDF_WORKING_PATH,
  UNITREE_H2_URDF_RAW_URL,
  UNITREE_H2_URDF_WORKING_PATH,
} from "@/lib/unitree-default-urdf";
import {
  loadPreferences,
  notifyPreferencesChanged,
  savePreferences,
  subscribePreferences,
} from "@/lib/preferences";
import type { UrdfPreviewSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StringMsg {
  data: string;
}

interface RobotModel3DProps {
  className?: string;
  /** ROS topic with the URDF as a `std_msgs/String`. */
  urdfTopic?: string;
  /** Background color (CSS). */
  background?: string;
  /** Show source picker + upload controls (Cockpit only). */
  showSourcePicker?: boolean;
}

function meshBaseToWorkingPath(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.endsWith("/") ? t : `${t}/`;
}

/**
 * Renders URDF from `/robot_description`, bundled Unitree models, or an
 * uploaded file. Three.js is lazy-loaded on mount.
 */
export function RobotModel3D({
  className,
  urdfTopic = "/robot_description",
  background = "transparent",
  showSourcePicker = true,
}: RobotModel3DProps) {
  const fileInputId = useId();
  /** Only Three.js touches this node — never put React children inside. */
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  const [source, setSource] = useState<UrdfPreviewSource>(
    () => loadPreferences().urdfPreviewSource,
  );
  const [uploadedUrdf, setUploadedUrdf] = useState("");
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadMeshBase, setUploadMeshBase] = useState("");

  const [presetXml, setPresetXml] = useState<string | null>(null);
  const [presetFailed, setPresetFailed] = useState(false);

  const { message: urdf } = useTopic<StringMsg>(urdfTopic, "std_msgs/String");
  const topicXml = urdf?.data?.trim() ?? "";

  useEffect(() => {
    const unsub = subscribePreferences(() => {
      setSource(loadPreferences().urdfPreviewSource);
    });
    return unsub;
  }, []);

  const persistSource = (next: UrdfPreviewSource) => {
    setSource(next);
    savePreferences({ urdfPreviewSource: next });
    notifyPreferencesChanged();
  };

  useEffect(() => {
    const url =
      source === "humanoid_h2"
        ? UNITREE_H2_URDF_RAW_URL
        : source === "humanoid_g1"
          ? UNITREE_G1_URDF_RAW_URL
          : source === "dog"
            ? UNITREE_GO2_URDF_RAW_URL
            : null;
    if (!url) {
      setPresetXml(null);
      setPresetFailed(false);
      return;
    }
    const ac = new AbortController();
    setPresetFailed(false);
    setPresetXml(null);
    void fetch(url, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      })
      .then((text) => setPresetXml(text))
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setPresetXml(null);
        setPresetFailed(true);
      });
    return () => ac.abort();
  }, [source]);

  const uploadXml = uploadedUrdf.trim();
  const xml = source === "ros" ? topicXml : source === "upload" ? uploadXml : (presetXml ?? "");

  const meshWorkingPath =
    source === "humanoid_h2"
      ? UNITREE_H2_URDF_WORKING_PATH
      : source === "humanoid_g1"
        ? UNITREE_G1_URDF_WORKING_PATH
        : source === "upload"
          ? meshBaseToWorkingPath(uploadMeshBase)
          : "";

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !xml) return;

    setReady(false);
    setError(undefined);

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const URDFLoaderModule = await import("urdf-loader");
        const URDFLoader = (
          URDFLoaderModule as unknown as { default: typeof URDFLoaderModule.default }
        ).default;

        if (disposed) return;

        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);

        const scene = new THREE.Scene();
        if (background && background !== "transparent") {
          scene.background = new THREE.Color(background);
        }
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(2, 5, 3);
        scene.add(dir);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
        camera.position.set(1.2, 1, 1.2);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: background === "transparent",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        mount.replaceChildren(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, source === "dog" ? 0.12 : 0.28, 0);

        const grid = new THREE.GridHelper(4, 8, 0x444444, 0x222222);
        scene.add(grid);

        const loader = new URDFLoader();
        loader.workingPath = meshWorkingPath;
        loader.packages = source === "dog" ? { go2_description: UNITREE_GO2_PACKAGE_ROOT } : "";
        const robot = loader.parse(xml);
        robot.rotation.x = -Math.PI / 2;
        scene.add(robot);
        setReady(true);

        let raf = 0;
        const animate = () => {
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
          const w = Math.max(1, mount.clientWidth);
          const h = Math.max(1, mount.clientHeight);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        const ro = new ResizeObserver(handleResize);
        ro.observe(mount);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
        };
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : "URDF render failed");
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [xml, meshWorkingPath, background, source]);

  const presetKind =
    source === "humanoid_h2" || source === "humanoid_g1" || source === "dog" ? source : null;
  const loadingPreset = presetKind !== null && presetXml === null && !presetFailed;
  const loadingScene = Boolean(xml) && !ready && !error;
  const showSpinner = loadingPreset || loadingScene;

  const idleRos = source === "ros" && !topicXml;
  const idleUpload = source === "upload" && !uploadXml;

  const hint =
    ready && !error
      ? source === "humanoid_h2"
        ? "Offline · Unitree H2 humanoid"
        : source === "humanoid_g1"
          ? "Offline · Unitree G1 humanoid"
          : source === "dog"
            ? "Offline · Unitree Go2 quadruped"
            : source === "ros" && topicXml
              ? "Live · /robot_description"
              : source === "upload" && uploadXml
                ? `Local · ${uploadFileName ?? "URDF"}`
                : null
      : null;

  const onUrdfFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setUploadedUrdf(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      {showSourcePicker && (
        <div className="flex flex-col gap-2 px-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid w-full min-w-0 gap-1 sm:max-w-[220px]">
              <Label htmlFor="urdf-source" className="text-muted-foreground text-xs">
                URDF source
              </Label>
              <Select value={source} onValueChange={(v) => persistSource(v as UrdfPreviewSource)}>
                <SelectTrigger id="urdf-source" className="min-h-11 w-full">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="humanoid_g1">Humanoid · Unitree G1</SelectItem>
                  <SelectItem value="humanoid_h2">Humanoid · Unitree H2</SelectItem>
                  <SelectItem value="dog">Dog · Unitree Go2</SelectItem>
                  <SelectItem value="ros">Live ROS · /robot_description</SelectItem>
                  <SelectItem value="upload">Upload URDF file</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {source === "upload" && (
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full shrink-0 sm:w-auto"
                  asChild
                >
                  <label
                    htmlFor={fileInputId}
                    className="inline-flex cursor-pointer items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose .urdf…
                  </label>
                </Button>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".urdf,text/xml,application/xml"
                  className="sr-only"
                  onChange={(e) => {
                    onUrdfFile(e.target.files);
                    e.target.value = "";
                  }}
                />
                {uploadFileName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground min-h-11 w-full sm:w-auto"
                    onClick={() => {
                      setUploadedUrdf("");
                      setUploadFileName(null);
                    }}
                  >
                    Clear file
                  </Button>
                )}
              </div>
            )}
          </div>

          {source === "upload" && (
            <div className="grid min-w-0 gap-1">
              <Label htmlFor="urdf-mesh-base" className="text-muted-foreground text-xs">
                Mesh base URL (optional)
              </Label>
              <Input
                id="urdf-mesh-base"
                className="font-mono text-xs"
                placeholder="https://…/your_package/  — folder containing meshes/… paths from URDF"
                value={uploadMeshBase}
                onChange={(e) => setUploadMeshBase(e.target.value)}
              />
              <p className="text-muted-foreground text-[10px]">
                For URDFs with relative mesh paths.{" "}
                <code className="bg-muted rounded px-1">package://</code> meshes need an accessible
                mirror — use your host or raw GitHub paths.
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "border-border bg-card relative min-h-[180px] flex-1 overflow-hidden rounded-xl border",
          showSourcePicker && "min-h-[160px]",
        )}
      >
        <div ref={mountRef} className="absolute inset-0 z-0 min-h-0 touch-none" aria-hidden />

        {showSpinner && !error && (
          <div className="text-muted-foreground pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">{loadingPreset ? "loading preset URDF…" : "loading URDF…"}</p>
          </div>
        )}

        {presetKind !== null && presetFailed && !error && (
          <div className="text-muted-foreground pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <Box className="h-5 w-5 shrink-0" />
            <p className="text-xs">Could not download preset URDF (network).</p>
          </div>
        )}

        {(idleRos || idleUpload) && !error && !loadingScene && !showSpinner && (
          <div className="text-muted-foreground pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <Box className="h-5 w-5 shrink-0" />
            <p className="text-xs">
              {idleRos
                ? `No ${urdfTopic} on this connection yet — pick G1, H2, Go2, or Upload for a preview.`
                : "Choose a `.urdf` file above. Optional mesh base URL resolves relative paths."}
            </p>
          </div>
        )}

        {error && (
          <div className="text-muted-foreground pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-2">
            <Box className="h-5 w-5 shrink-0" />
            <p className="max-w-full text-center text-xs break-words">{error}</p>
          </div>
        )}

        {hint && (
          <p className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 left-2 z-10 text-center text-[10px]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
