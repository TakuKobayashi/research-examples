package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import net.taptappun.taku.kobayashi.nearbyconnectionsample.databinding.ActivityMainBinding
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private lateinit var nearbyConnectionManager: NearbyConnectionManager
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val nicknameEditText = binding.advertisingNicknameText
        nicknameEditText.setText(UUID.randomUUID().toString())
        binding.advertisingStartButton.setOnClickListener {
            if (allPermissionsGranted()) {
                nearbyConnectionManager.startNearbyAdvertising(nicknameEditText.text.toString())
            } else {
                // permission許可要求
                ActivityCompat.requestPermissions(
                    this,
                    REQUIRED_PERMISSIONS,
                    REQUEST_CODE_START_ADVERTISING_PERMISSIONS
                )
            }
        }
        binding.discoveryStartButton.setOnClickListener {
            if (allPermissionsGranted()) {
                nearbyConnectionManager.startDiscovery()
            } else {
                // permission許可要求
                ActivityCompat.requestPermissions(
                    this,
                    REQUIRED_PERMISSIONS,
                    REQUEST_CODE_START_DISCOVERY_PERMISSIONS
                )
            }
        }
        nearbyConnectionManager = NearbyConnectionManager(this, receivedPayloadCallback)


    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults:
        IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_START_ADVERTISING_PERMISSIONS) {
            if (allPermissionsGranted()) {
                nearbyConnectionManager.startNearbyAdvertising(binding.advertisingNicknameText.text.toString())
            }
        } else if (requestCode == REQUEST_CODE_START_DISCOVERY_PERMISSIONS) {
            if (allPermissionsGranted()) {
                nearbyConnectionManager.startDiscovery()
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private val receivedPayloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            Log.d(TAG, "payloadReceived:${endpointId}")
            when (payload.type) {
                Payload.Type.BYTES -> {
                    // バイト配列を受け取った時
                    val data = payload.asBytes()!!
                    // 処理
                }
                Payload.Type.FILE -> {
                    // ファイルを受け取った時
                    val file = payload.asFile()!!
                    // 処理
                }
                Payload.Type.STREAM -> {
                    // ストリームを受け取った時
                    val stream = payload.asStream()!!
                    // 処理
                }
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // 転送状態が更新された時詳細は省略
            Log.d(TAG, "payloadUpdate:${endpointId}")
        }
    }

    /**
     * A native method that is implemented by the 'nearbyconnectionsample' native library,
     * which is packaged with this application.
     */
    external fun stringFromJNI(): String

    companion object {
        // Used to load the 'nearbyconnectionsample' library on application startup.
        init {
            System.loadLibrary("nearbyconnectionsample")
        }
        const val TAG = "NearbyConnectionSample"
        private const val REQUEST_CODE_START_ADVERTISING_PERMISSIONS = 20
        private const val REQUEST_CODE_START_DISCOVERY_PERMISSIONS = 30
        private val REQUIRED_PERMISSIONS =
            mutableListOf(
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.READ_EXTERNAL_STORAGE,
            ).apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    add(Manifest.permission.BLUETOOTH_ADVERTISE)
                    add(Manifest.permission.BLUETOOTH_CONNECT)
                    add(Manifest.permission.BLUETOOTH_SCAN)
                }
            }.toTypedArray()
    }
}