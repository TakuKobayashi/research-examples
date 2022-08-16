package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.content.Context
import android.util.Log
import android.widget.Toast
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.Strategy
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionResolution

class NearbyConnectionManager(
    private val context: Context,
    private val payloadCallback: PayloadCallback
) {

    private val nearbyConnectionClient = Nearby.getConnectionsClient(context.applicationContext)
    private val foundEndpoints = mutableMapOf<String, DiscoveredEndpointInfo>()
    private val mayConnectingEndpointIdNicknames = mutableMapOf<String, String>()
    private val connectSuccessEndpointIds = mutableSetOf<String>()
    private var connectionCallback: ConnectionCallback? = null

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

    private var requestEndpointId: String? = null

    public fun requestConnection(nickname: String, endpointId: String){
        Log.d(MainActivity.TAG, "requestConnection:${endpointId} requestNickname:${nickname}")
        requestEndpointId = endpointId
        // コネクションをリクエストした段階で成功することを前提に一旦情報を保持する(ダメだった時には消す)
        mayConnectingEndpointIdNicknames[endpointId] = nickname
        nearbyConnectionClient.requestConnection(nickname, endpointId, connectionLifecycleCallback)
    }

    fun acceptConnection(endpointId: String){
        connectSuccessEndpointIds.add(endpointId)
        nearbyConnectionClient.acceptConnection(endpointId, payloadCallback)
    }

    fun rejectConnection(endpointId: String){
        mayConnectingEndpointIdNicknames.remove(endpointId)
        connectSuccessEndpointIds.remove(endpointId)
        nearbyConnectionClient.rejectConnection(endpointId)
    }

    fun setConnectionCallback(callback: ConnectionCallback){
        connectionCallback = callback
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, discoveredEndpointInfo: DiscoveredEndpointInfo) {
            // Advertise側を発見した
            // discoveredEndpointInfo.endpointName: Advertisingで送った人のニックネームの情報を取得する
            Log.d(MainActivity.TAG, "found:${endpointId} endpointName:${discoveredEndpointInfo.endpointName} serviceId:${discoveredEndpointInfo.serviceId}")
            // Connectionを要求する処理
            foundEndpoints[endpointId] = discoveredEndpointInfo
            connectionCallback?.onEndpointFound(endpointId, discoveredEndpointInfo)
        }

        override fun onEndpointLost(endpointId: String) {
            // 見つけたエンドポイントを見失った
            foundEndpoints.remove(endpointId)
            connectionCallback?.onEndpointLost(endpointId)
        }
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            Log.d(MainActivity.TAG, "connectionResult:${endpointId} connectionInfo:${connectionInfo.endpointName} isIncomingConnection:${connectionInfo.isIncomingConnection}")
            // 他の端末からコネクションのリクエストを受け取った時
            // とりあえず来る者は拒まず即承認
            // 承認した段階でコネクションが確立されたと仮定する
            mayConnectingEndpointIdNicknames[endpointId] = connectionInfo.endpointName
            // isIncomingConnection: requestを受け取った場合はtrue、送った場合はfalse
            if(connectionInfo.isIncomingConnection){
                connectionCallback?.onReceivedConnectionRequest(endpointId, connectionInfo)
            }
            //connectSuccessEndpointIds.add(endpointId)
            //nearbyConnectionClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            Log.d(MainActivity.TAG, "connectionResult:${endpointId} code:${result.status.statusCode} statusMessage:${result.status.statusMessage}")
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
            connectionCallback?.onDisconnected(endpointId)
        }
    }

    interface ConnectionCallback {
        fun onDisconnected(endpointId: String)
        fun onReceivedConnectionRequest(endpointId: String, connectionInfo: ConnectionInfo)
        fun onEndpointFound(endpointId: String, discoveredEndpointInfo: DiscoveredEndpointInfo)
        fun onEndpointLost(endpointId: String)
    }
}