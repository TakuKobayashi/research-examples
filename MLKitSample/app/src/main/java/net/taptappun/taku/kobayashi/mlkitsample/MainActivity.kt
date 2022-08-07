package net.taptappun.taku.kobayashi.mlkitsample

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.PackageManager
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.util.SparseIntArray
import android.view.Surface
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import net.taptappun.taku.kobayashi.mlkitsample.databinding.ActivityMainBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private val imageAnalysisExecutor: ExecutorService by lazy {
        Executors.newSingleThreadExecutor()
    }
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (allPermissionsGranted()) {
            // permissionは得られているので、カメラ始動
            startCamera()
        } else {
            // permission許可要求
            ActivityCompat.requestPermissions(
                this,
                REQUIRED_PERMISSIONS,
                REQUEST_CODE_PERMISSIONS
            )
        }

        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_AZTEC)
            .build()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults:
        IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                // カメラ開始処理
                startCamera()
            } else {
                Toast.makeText(this,
                    "Permissions not granted by the user.",
                    Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            // ライフサイクルにバインドするために利用する
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // PreviewのUseCase
            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(binding.cameraPreview.surfaceProvider)

            val imageAnalysis = ImageAnalysis.Builder()
                // enable the following line if RGBA output is needed.
                //.setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            imageAnalysis.setAnalyzer(imageAnalysisExecutor, ImageAnalysis.Analyzer { imageProxy ->
                val mediaImage = imageProxy.image
                if (mediaImage != null) {
                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                    detectFaces(image)
                    scanBarcodes(image)
                    // Pass image to an ML Kit Vision API
                    // ...
                }
                // insert your code here.
                // after done, release the ImageProxy object
                imageProxy.close()
            })

            // アウトカメラを設定
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            // バインドされているカメラを解除
            cameraProvider.unbindAll()
            // カメラをライフサイクルにバインド
            cameraProvider.bindToLifecycle(
                this,
                cameraSelector,
                preview,
                imageAnalysis
            )
        }, ContextCompat.getMainExecutor(this))
    }

    private fun detectFaces(image: InputImage) {
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
        detector.process(image).addOnSuccessListener { faces ->
            // Task completed successfully
            // [START_EXCLUDE]
            // [START get_face_info]
            for (face in faces) {
                val bounds = face.boundingBox
                val rotX = face.headEulerAngleX // Head is rotated to the right rotX degrees
                val rotY = face.headEulerAngleY // Head is rotated to the right rotY degrees
                val rotZ = face.headEulerAngleZ // Head is tilted sideways rotZ degrees
                Log.d(TAG, "faceBounds:$bounds faceRotX:$rotX faceRotY:$rotY faceRotZ:$rotZ")

                // If classification was enabled:
                if (face.smilingProbability != null) {
                    val smileProb = face.smilingProbability
                    Log.d(TAG, "smileProb:$smileProb")
                }
                if (face.leftEyeOpenProbability != null) {
                    val leftEyeOpenProb = face.leftEyeOpenProbability
                    Log.d(TAG, "leftEyeOpenProb:$leftEyeOpenProb")
                }
                if (face.rightEyeOpenProbability != null) {
                    val rightEyeOpenProb = face.rightEyeOpenProbability
                    Log.d(TAG, "rightEyeOpenProb:$rightEyeOpenProb")
                }

                // If face tracking was enabled:
                if (face.trackingId != null) {
                    val id = face.trackingId
                    Log.d(TAG, "faceId:$id")
                }
            }
            // [END get_face_info]
        }.addOnFailureListener { e ->
            // Task failed with an exception
        }
        // [END run_detector]
    }

    private fun scanBarcodes(image: InputImage) {
        // [START set_detector_options]
        // Format: https://zenn.dev/mochico/articles/0c1f1104852659
        // https://developers.google.com/ml-kit/vision/barcode-scanning/android
        /*
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_AZTEC)
            .build()
        */
        // [END set_detector_options]

        // [START get_detector]
        val scanner = BarcodeScanning.getClient()
        // Or, to specify the formats to recognize:
//        val scanner = BarcodeScanning.getClient(options)
        // [END get_detector]

        // [START run_detector]
        scanner.process(image).addOnSuccessListener { barcodes ->
            // Task completed successfully
            // [START_EXCLUDE]
            // [START get_barcodes]
            for (barcode in barcodes) {
                val bounds = barcode.boundingBox
                val corners = barcode.cornerPoints
                val rawValue = barcode.rawValue
                val valueType = barcode.valueType
                Log.d(TAG, "barCodeBounds:$bounds barCodeRawValue:$rawValue barcodeValueType:$valueType barcodeCornersCount:${corners}")
                // See API reference for complete list of supported types
                when (valueType) {
                    Barcode.TYPE_WIFI -> {
                        val ssid = barcode.wifi!!.ssid
                        val password = barcode.wifi!!.password
                        val type = barcode.wifi!!.encryptionType
                    }
                    Barcode.TYPE_URL -> {
                        val title = barcode.url!!.title
                        val url = barcode.url!!.url
                        Log.d(TAG, "barCodeTitle:$title barCodeUrl:$url")
                    }
                }
            }
            // [END get_barcodes]
            // [END_EXCLUDE]
        }.addOnFailureListener {
            // Task failed with an exception
        }
        // [END run_detector]
    }

    /**
     * Get the angle by which an image must be rotated given the device's current
     * orientation.
     */
    @Throws(CameraAccessException::class)
    private fun getRotationCompensation(cameraId: String, activity: Activity, isFrontFacing: Boolean): Int {
        val ORIENTATIONS = SparseIntArray()
        ORIENTATIONS.append(Surface.ROTATION_0, 0)
        ORIENTATIONS.append(Surface.ROTATION_90, 90)
        ORIENTATIONS.append(Surface.ROTATION_180, 180)
        ORIENTATIONS.append(Surface.ROTATION_270, 270)
        // Get the device's current rotation relative to its "native" orientation.
        // Then, from the ORIENTATIONS table, look up the angle the image must be
        // rotated to compensate for the device's rotation.
        val deviceRotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (this.display == null){
                0
            } else {
                this.display!!.rotation
            }
        } else {
            this.windowManager.defaultDisplay.rotation
        }
        var rotationCompensation = ORIENTATIONS.get(deviceRotation)

        // Get the device's sensor orientation.
        val cameraManager = activity.getSystemService(CAMERA_SERVICE) as CameraManager
        val sensorOrientation = cameraManager
            .getCameraCharacteristics(cameraId)
            .get(CameraCharacteristics.SENSOR_ORIENTATION)!!

        if (isFrontFacing) {
            rotationCompensation = (sensorOrientation + rotationCompensation) % 360
        } else { // back-facing
            rotationCompensation = (sensorOrientation - rotationCompensation + 360) % 360
        }
        return rotationCompensation
    }

    /**
     * A native method that is implemented by the 'mlkitsample' native library,
     * which is packaged with this application.
     */
    external fun stringFromJNI(): String

    companion object {
        // Used to load the 'mlkitsample' library on application startup.
        init {
            System.loadLibrary("mlkitsample")
        }
        private const val TAG = "MLKitSample"
        private const val REQUEST_CODE_PERMISSIONS = 10
        // 必要なpermissionのリスト
        private val REQUIRED_PERMISSIONS =
            mutableListOf (
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO
            ).apply {
                // WRITE_EXTERNAL_STORAGEはPie以下で必要
                if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                    add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                }
            }.toTypedArray()
    }
}