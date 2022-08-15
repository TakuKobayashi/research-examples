package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.advertisingStartButton.setOnClickListener {
            startNearbyAdvertising()
        }
        binding.advertisingStartButton.setOnClickListener {
            startDiscovery()
        }
    }

    private fun startNearbyAdvertising() {
        val advertisingOptions = AdvertisingOptions.Builder()
            .setStrategy(Strategy.P2P_STAR)
            .build()
        val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
        nearbyConnectionClient.startAdvertising(
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
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
                UUID.randomUUID().toString(),
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

            val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
            // とりあえず問答無用でコネクション要求してみる
            nearbyConnectionClient.requestConnection(UUID.randomUUID().toString(), endpointId, mConnectionLifecycleCallback)
        }

        override fun onEndpointLost(endpointId: String) {
            // 見つけたエンドポイントを見失った
        }
    }

    private val connectingEndpointIds = mutableSetOf<String>()

    private val mConnectionLifecycleCallback = object : ConnectionLifecycleCallback() {

        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            // 他の端末からコネクションのリクエストを受け取った時

            val nearbyConnectionClient = Nearby.getConnectionsClient(applicationContext)
            // とりあえず来る者は拒まず即承認
            nearbyConnectionClient
                .acceptConnection(endpointId, mPayloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {

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
            connectingEndpointIds.remove(endpointId)
        }

    }

    private val mPayloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
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
    }
}