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
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.Strategy
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionResolution
import net.taptappun.taku.kobayashi.nearbyconnectionsample.databinding.ActivityMainBinding
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private val connectingEndpointIds = mutableSetOf<String>()
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.advertisingStartButton.setOnClickListener {
            startNearbyAdvertising()
        }
        binding.discoveryStartButton.setOnClickListener {
            startDiscovery()
        }
        if (allPermissionsGranted()) {
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
            } else {
                Toast.makeText(
                    this,
                    "Permissions not granted by the user.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun startNearbyAdvertising() {
        val advertisingOptions = AdvertisingOptions.Builder()
            .setStrategy(Strategy.P2P_STAR)
            .build()
        val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
        // startAdvertising: 自分の近くでdiscoveryしている人を探す
        nearbyConnectionClient.startAdvertising(
            // ここは自分のニックネームの情報を送る
            "test",
            packageName,
            mConnectionLifecycleCallback,
            advertisingOptions
        )
            .addOnSuccessListener {
                // Advertise開始した
                Toast.makeText(this, "StartAdvertising", Toast.LENGTH_LONG).show()
            }
            .addOnFailureListener {
                // Advertiseできなかった
                Toast.makeText(this, "Advertising Fail ${it.message}", Toast.LENGTH_LONG).show()
            }
    }

    private fun startDiscovery() {
        val discoveryOptions = DiscoveryOptions.Builder()
            .setStrategy(Strategy.P2P_STAR)
            .build()
        val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
        nearbyConnectionClient.startDiscovery(
                packageName,
                mEndpointDiscoveryCallback,
                discoveryOptions)
            .addOnSuccessListener {
                // Discovery開始した
                Toast.makeText(this, "StartDiscovery", Toast.LENGTH_LONG).show()
            }
            .addOnFailureListener {
                // Discovery開始できなかった
                Toast.makeText(this, "Discovery Fail ${it.message}", Toast.LENGTH_LONG).show()
            }
    }

    private val mEndpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, discoveredEndpointInfo: DiscoveredEndpointInfo) {
            // Advertise側を発見した
            // discoveredEndpointInfo.endpointName: Advertisingで送った人のニックネームの情報を取得する
            Log.d(TAG, "found:${endpointId} endpointName:${discoveredEndpointInfo.endpointName} serviceId:${discoveredEndpointInfo.serviceId}")

            val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
            // とりあえず問答無用でコネクション要求してみる
            // Connectionを要求する処理
            nearbyConnectionClient.requestConnection("test", endpointId, mConnectionLifecycleCallback)
        }

        override fun onEndpointLost(endpointId: String) {
            // 見つけたエンドポイントを見失った
        }
    }

    private val mConnectionLifecycleCallback = object : ConnectionLifecycleCallback() {

        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            // 他の端末からコネクションのリクエストを受け取った時
            Log.d(TAG, "connection:${endpointId} endpointName:${connectionInfo.endpointName}")

            val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
            // とりあえず来る者は拒まず即承認
            nearbyConnectionClient
                .acceptConnection(endpointId, mPayloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            Log.d(TAG, "connectionResult:${endpointId} statusMessage:${result.status.statusMessage}")
            // コネクションリクエストの結果を受け取った時

            when (result.status.statusCode) {
                ConnectionsStatusCodes.STATUS_OK -> {
                    // コネクションが確立した。今後通信が可能。
                    // 通信時にはendpointIdが必要になるので、フィールドに保持する。
                    connectingEndpointIds.add(endpointId)
                }

                ConnectionsStatusCodes.STATUS_CONNECTION_REJECTED -> {
                    // コネクションが拒否された時。通信はできない。
                }

                ConnectionsStatusCodes.STATUS_ERROR -> {
                    // エラーでコネクションが確立できない時。通信はできない。
                }
            }
        }

        // コネクションが切断された時
        override fun onDisconnected(endpointId: String) {
            Log.d(TAG, "disconnect:${endpointId}")
            connectingEndpointIds.remove(endpointId)
        }

    }

    private val mPayloadCallback = object : PayloadCallback() {
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
        private const val REQUEST_CODE_PERMISSIONS = 10
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