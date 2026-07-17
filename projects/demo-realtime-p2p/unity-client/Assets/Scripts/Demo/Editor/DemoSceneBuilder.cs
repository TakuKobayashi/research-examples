using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace PhantomCatWorks.RealtimeP2PKit.Demo.Editor
{
    /// <summary>
    /// Builds the P2P demo scene procedurally. A .unity scene is a large binary/YAML
    /// asset that doesn't make sense to hand-author outside the Editor, so instead
    /// this menu command generates it deterministically: run it once after importing
    /// this package and its dependencies (see README.md), and it produces
    /// Assets/Scenes/P2PDemo.unity wired up and ready to press Play.
    /// </summary>
    public static class DemoSceneBuilder
    {
        [MenuItem("RealtimeP2PKit/Build Demo Scene")]
        public static void BuildScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Camera
            var camGo = new GameObject("Main Camera");
            camGo.AddComponent<Camera>();
            camGo.transform.position = new Vector3(0, 8, -8);
            camGo.transform.LookAt(Vector3.zero);
            camGo.tag = "MainCamera";

            // Light
            var lightGo = new GameObject("Directional Light");
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Directional;
            lightGo.transform.rotation = Quaternion.Euler(50, -30, 0);

            // Ground
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.localScale = new Vector3(2, 1, 2);

            // Local / remote player prefabs (plain cubes for this proof of concept)
            var localGo = GameObject.CreatePrimitive(PrimitiveType.Cube);
            localGo.name = "LocalPlayer";
            ApplyColor(localGo, Color.cyan);
            localGo.AddComponent<DemoPlayerController>();
            var localPrefab = SaveAsPrefab(localGo, "LocalPlayer");
            Object.DestroyImmediate(localGo);

            var remoteGo = GameObject.CreatePrimitive(PrimitiveType.Cube);
            remoteGo.name = "RemotePlayer";
            ApplyColor(remoteGo, Color.magenta);
            var remotePrefab = SaveAsPrefab(remoteGo, "RemotePlayer");
            Object.DestroyImmediate(remoteGo);

            var config = LoadOrCreateConfig();

            // Bootstrap object wiring everything together
            var bootstrapGo = new GameObject("DemoBootstrap");
            var bootstrap = bootstrapGo.AddComponent<DemoBootstrap>();
            var so = new SerializedObject(bootstrap);
            so.FindProperty("_config").objectReferenceValue = config;
            so.FindProperty("_localPlayerPrefab").objectReferenceValue = localPrefab;
            so.FindProperty("_remotePlayerPrefab").objectReferenceValue = remotePrefab;
            so.ApplyModifiedPropertiesWithoutUndo();

            EnsureFolder("Assets/Scenes");
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/P2PDemo.unity");
            Debug.Log("[DemoSceneBuilder] Built Assets/Scenes/P2PDemo.unity - " +
                      "set MatchmakingApiBaseUrl / PartyKitHost on Assets/Resources/P2PConfig.asset before pressing Play.");
        }

        private static void ApplyColor(GameObject go, Color color)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var mat = new Material(shader) { color = color };
            EnsureFolder("Assets/Materials");
            var path = AssetDatabase.GenerateUniqueAssetPath($"Assets/Materials/Demo_{go.name}.mat");
            AssetDatabase.CreateAsset(mat, path);
            go.GetComponent<Renderer>().sharedMaterial = mat;
        }

        private static GameObject SaveAsPrefab(GameObject go, string name)
        {
            EnsureFolder("Assets/Prefabs");
            var path = $"Assets/Prefabs/{name}.prefab";
            return PrefabUtility.SaveAsPrefabAsset(go, path);
        }

        private static P2PConfig LoadOrCreateConfig()
        {
            EnsureFolder("Assets/Resources");
            const string path = "Assets/Resources/P2PConfig.asset";
            var existing = AssetDatabase.LoadAssetAtPath<P2PConfig>(path);
            if (existing != null) return existing;

            var config = ScriptableObject.CreateInstance<P2PConfig>();
            AssetDatabase.CreateAsset(config, path);
            Debug.LogWarning("[DemoSceneBuilder] Created default P2PConfig.asset - " +
                              "set MatchmakingApiBaseUrl and PartyKitHost to your deployed endpoints.");
            return config;
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            var parent = Path.GetDirectoryName(path)?.Replace("\\", "/");
            var name = Path.GetFileName(path);
            if (!string.IsNullOrEmpty(parent) && !AssetDatabase.IsValidFolder(parent)) EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, name);
        }
    }
}
