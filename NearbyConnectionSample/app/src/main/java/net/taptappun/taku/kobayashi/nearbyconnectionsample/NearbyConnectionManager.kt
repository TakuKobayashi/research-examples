package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.content.Context
import android.util.Log
import android.widget.Toast
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

class NearbyConnectionManager(private val context: Context, payloadCallback: PayloadCallback) {

    private val nearbyConnectionClient = Nearby.getConnectionsClient(context.applicationContext)
    private val foundEndpoints = mutableMapOf<String, DiscoveredEndpointInfo>()
    private val mayConnectingEndpointIdNicknames = mutableMapOf<String, String>()
    private val connectSuccessEndpointIds = mutableSetOf<String>()

    // 探してもらえるようにする
    public fun startNearbyAdvertising(nickname: String) {
        val advertisingOptions = AdvertisingOptions.Builder()
            .setStrategy(Strategy.P2P_STAR)
            .build()
        // startAdvertising: 自分の近くでdiscoveryしている人を探す
        nearbyConnectionClient.startAdvertising(
            // ここは自分のニックネームの情報を送る
            nickname,
            context.packageName,
            connectionLifecycleCallback,
            advertisingOptions
        )
            .addOnSuccessListener {
                // Advertise開始した
                Toast.makeText(context, "StartAdvertising", Toast.LENGTH_LONG).show()
            }
            .addOnFailureListener {
                // Advertiseできなかった
                Toast.makeText(context, "Advertising Fail ${it.message}", Toast.LENGTH_LONG).show()
            }
    }

    // 接続する相手を探す
    public fun startDiscovery() {
        val discoveryOptions = DiscoveryOptions.Builder()
            .setStrategy(Strategy.P2P_STAR)
            .build()
        nearbyConnectionClient.startDiscovery(
            context.packageName,
            endpointDiscoveryCallback,
            discoveryOptions)
            .addOnSuccessListener {
                // Discovery開始した
                Toast.makeText(context, "StartDiscovery", Toast.LENGTH_LONG).show()
            }
            .addOnFailureListener {
                // Discovery開始できなかった
                Toast.makeText(context, "Discovery Fail ${it.message}", Toast.LENGTH_LONG).show()
            }
    }

    public fun requestConnection(nickname: String, endpointId: String){
        // コネクションをリクエストした段階で成功することを前提に一旦情報を保持する(ダメだった時には消す)
        mayConnectingEndpointIdNicknames[endpointId] = nickname
        nearbyConnectionClient.requestConnection(nickname, endpointId, connectionLifecycleCallback)
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, discoveredEndpointInfo: DiscoveredEndpointInfo) {
            // Advertise側を発見した
            // discoveredEndpointInfo.endpointName: Advertisingで送った人のニックネームの情報を取得する
            Log.d(MainActivity.TAG, "found:${endpointId} endpointName:${discoveredEndpointInfo.endpointName} serviceId:${discoveredEndpointInfo.serviceId}")
            // Connectionを要求する処理
            foundEndpoints[endpointId] = discoveredEndpointInfo
            requestConnection("senderTest", endpointId)
        }

        override fun onEndpointLost(endpointId: String) {
            // 見つけたエンドポイントを見失った
            foundEndpoints.remove(endpointId)
        }
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            // 他の端末からコネクションのリクエストを受け取った時
            // とりあえず来る者は拒まず即承認
            // 承認した段階でコネクションが確立されたと仮定する
            mayConnectingEndpointIdNicknames[endpointId] = connectionInfo.endpointName
            connectSuccessEndpointIds.add(endpointId)
            nearbyConnectionClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            Log.d(MainActivity.TAG, "connectionResult:${endpointId} statusMessage:${result.status.statusMessage}")
            // コネクションリクエストの結果を受け取った時

            when (result.status.statusCode) {
                ConnectionsStatusCodes.STATUS_OK -> {
                    // コネクションが確立した。今後通信が可能。
                    // 通信時にはendpointIdが必要になるので、フィールドに保持する。
                    connectSuccessEndpointIds.add(endpointId)
                    // コネクションのリクエストが承認されたら見つかった一覧から取り除いてあげる
                    foundEndpoints.remove(endpointId)
                    // コネクションのリクエストが承認されたら、相手からの情報も受け取れるようにするためにこっちも承認する
                    nearbyConnectionClient.acceptConnection(endpointId, payloadCallback)
                }

                ConnectionsStatusCodes.STATUS_CONNECTION_REJECTED -> {
                    // コネクションが拒否された時。通信はできない。
                    mayConnectingEndpointIdNicknames.remove(endpointId)
                    connectSuccessEndpointIds.remove(endpointId)
                }

                ConnectionsStatusCodes.STATUS_ERROR -> {
                    // エラーでコネクションが確立できない時。通信はできない。
                    mayConnectingEndpointIdNicknames.remove(endpointId)
                    connectSuccessEndpointIds.remove(endpointId)
                }
            }
        }

        // コネクションが切断された時
        override fun onDisconnected(endpointId: String) {
            Log.d(MainActivity.TAG, "disconnect:${endpointId}")
            mayConnectingEndpointIdNicknames.remove(endpointId)
            connectSuccessEndpointIds.remove(endpointId)
        }

    }
}