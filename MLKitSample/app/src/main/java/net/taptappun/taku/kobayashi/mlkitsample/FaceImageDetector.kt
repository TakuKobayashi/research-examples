package net.taptappun.taku.kobayashi.mlkitsample

import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class FaceImageDetector : ImageDetector<Face>() {
    public override fun detect(image: InputImage) {
        // High-accuracy landmark detection and face classification
        /*
        val highAccuracyOpts = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .build()

        // Real-time contour detection
        val realTimeOpts = FaceDetectorOptions.Builder()
            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
            .build()
         */

        // [START set_detector_options]
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            // .setMinFaceSize(0.15f)
            .enableTracking()
            .build()
        // [END set_detector_options]

        // [START get_detector]
        val detector = FaceDetection.getClient(options)
        // Or, to use the default option:
        // val detector = FaceDetection.getClient();
        // [END get_detector]

        // [START run_detector]
        detector.process(image)
            .addOnSuccessListener { faces -> renderDetectMarks(faces) }
            .addOnFailureListener { e ->
                // Task failed with an exception
            }
        // [END run_detector]
    }

    override fun renderDetectMarks(detects: MutableList<Face>) {
        // Task completed successfully
        // [START_EXCLUDE]
        // [START get_face_info]
        for (face in detects) {
            val bounds = face.boundingBox
            val rotX = face.headEulerAngleX // Head is rotated to the right rotX degrees
            val rotY = face.headEulerAngleY // Head is rotated to the right rotY degrees
            val rotZ = face.headEulerAngleZ // Head is tilted sideways rotZ degrees
            Log.d(MainActivity.TAG, "faceBounds:$bounds faceRotX:$rotX faceRotY:$rotY faceRotZ:$rotZ")

            // If classification was enabled:
            if (face.smilingProbability != null) {
                val smileProb = face.smilingProbability
                Log.d(MainActivity.TAG, "smileProb:$smileProb")
            }
            if (face.leftEyeOpenProbability != null) {
                val leftEyeOpenProb = face.leftEyeOpenProbability
                Log.d(MainActivity.TAG, "leftEyeOpenProb:$leftEyeOpenProb")
            }
            if (face.rightEyeOpenProbability != null) {
                val rightEyeOpenProb = face.rightEyeOpenProbability
                Log.d(MainActivity.TAG, "rightEyeOpenProb:$rightEyeOpenProb")
            }

            // If face tracking was enabled:
            if (face.trackingId != null) {
                val id = face.trackingId
                Log.d(MainActivity.TAG, "faceId:$id")
            }
        }
    }
}
