package net.taptappun.taku.kobayashi.androidnetworkstream

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import net.taptappun.taku.kobayashi.androidnetworkstream.databinding.ActivityMainBinding
import org.webrtc.*


class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val disconnectButton = binding.buttonCallDisconnect
        val cameraSwitchButton = binding.buttonCallSwitchCamera
        val toggleMuteButton = binding.buttonCalltoggleMic

        disconnectButton.setOnClickListener { v->

        }

        cameraSwitchButton.setOnClickListener { v->

        }

        toggleMuteButton.setOnClickListener { v->

        }

        //Initialize PeerConnectionFactory globals.
        //Params are context, initAudio,initVideo and videoCodecHwAcceleration
        //PeerConnectionFactory.initializeAndroidGlobals(this, true, true, true);
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(this).createInitializationOptions()
        )

        //Create a new PeerConnectionFactory instance.
        //PeerConnectionFactory.Options options = new PeerConnectionFactory.Options();
        val builder = PeerConnectionFactory.builder()
        val peerConnectionFactory = builder.createPeerConnectionFactory()

        //val pipRenderer = binding.pipVideoView
        //val fullscreenRenderer = binding.fullscreenVideoView


        val videoCaptureAndroid = createCameraCapture(Camera1Enumerator(false))
        val constraints = MediaConstraints()
        val rootEglBase = EglBase.create()
        val surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", rootEglBase.eglBaseContext)
        val videoSource = peerConnectionFactory.createVideoSource(
            videoCaptureAndroid!!.isScreencast
        )
        videoCaptureAndroid?.initialize(surfaceTextureHelper, this, videoSource.capturerObserver)
        val localVideoTrack = peerConnectionFactory.createVideoTrack("100", videoSource)
        val audioSource = peerConnectionFactory.createAudioSource(constraints)
        val localAudioTrack = peerConnectionFactory.createAudioTrack("101", audioSource)
        //we will start capturing the video from the camera
        //width,height and fps
        videoCaptureAndroid!!.startCapture(1000, 1000, 30)
        //create surface renderer, init it and add the renderer to the track
        val videoView = binding.pipVideoView
        videoView.init(rootEglBase.eglBaseContext, null)
        videoView.visibility = View.VISIBLE

        localVideoTrack.addSink(videoView)
        videoView.setMirror(true)
        //localVideoTrack.addRenderer(VideoRenderer(videoView));

        // Create video renderers.
        //pipRenderer.init(peerConnectionClient.getRenderContext(), null)
        //pipRenderer.setScalingType(ScalingType.SCALE_ASPECT_FIT)

        //fullscreenRenderer.init(peerConnectionClient.getRenderContext(), null)
        //fullscreenRenderer.setScalingType(ScalingType.SCALE_ASPECT_FILL)

        //pipRenderer.setZOrderMediaOverlay(true);
        //pipRenderer.setEnableHardwareScaler(true /* enabled */);
        //fullscreenRenderer.setEnableHardwareScaler(true /* enabled */);


        // Example of a call to a native method
        binding.sampleText.text = stringFromJNI()

        if (allPermissionsGranted()) {
            // permissionは得られているので、カメラ始動
            //startCamera()
        } else {
            // permission許可要求
            ActivityCompat.requestPermissions(
                this,
                REQUIRED_PERMISSIONS,
                REQUEST_CODE_PERMISSIONS
            )
        }
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
                //startCamera()
            } else {
                Toast.makeText(
                    this,
                    "Permissions not granted by the user.",
                    Toast.LENGTH_SHORT
                ).show()
                finish()
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun createCameraCapture(enumerator: CameraEnumerator): VideoCapturer? {
        val deviceNames = enumerator.deviceNames

        // First, try to find front facing camera
        Logging.d(TAG, "Looking for front facing cameras.")
        for (deviceName in deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                Logging.d(TAG, "Creating front facing camera capturer.")
                val videoCapturer: VideoCapturer? = enumerator.createCapturer(deviceName, null)
                if (videoCapturer != null) {
                    return videoCapturer
                }
            }
        }

        // Front facing camera not found, try something else
        Logging.d(TAG, "Looking for other cameras.")
        for (deviceName in deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                Logging.d(TAG, "Creating other camera capturer.")
                val videoCapturer: VideoCapturer? = enumerator.createCapturer(deviceName, null)
                if (videoCapturer != null) {
                    return videoCapturer
                }
            }
        }
        return null
    }

    /**
     * A native method that is implemented by the 'androidnetworkstream' native library,
     * which is packaged with this application.
     */
    external fun stringFromJNI(): String

    companion object {
        // Used to load the 'androidnetworkstream' library on application startup.
        init {
            System.loadLibrary("androidnetworkstream")
        }
        public const val TAG = "NetworkStream"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS =
            mutableListOf(
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