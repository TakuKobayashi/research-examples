package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.net.toFile
import androidx.documentfile.provider.DocumentFile
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.google.android.gms.nearby.connection.*
import net.taptappun.taku.kobayashi.nearbyconnectionsample.databinding.ActivityMainBinding
import org.msgpack.jackson.dataformat.MessagePackMapper
import java.io.File
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private lateinit var nearbyConnectionManager: NearbyConnectionManager
    private lateinit var binding: ActivityMainBinding
    private lateinit var foundListAdapter: FoundListAdapter
    private lateinit var connectionListAdapter: ConnectionListAdapter
    private var willSendBytesMaps = mutableMapOf<String, Any>()

    private val filePickStartActivityForResult = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
            result: ActivityResult ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null && result.data!!.data != null) {
            val dataIntent = result.data
            val projection = arrayOf(MediaStore.MediaColumns.DISPLAY_NAME)
            val cursor = contentResolver.query(dataIntent!!.data!!, projection, null, null, null)
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    willSendBytesMaps["fileName"] = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME))
                }
                cursor.close()
            }
            Log.d(TAG, "${dataIntent!!.data!!}")
            willSendBytesMaps["fileUri"] = dataIntent.data.toString()
            willSendBytesMaps["action"] = "requestSendFile"
        }
    }

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

        foundListAdapter = FoundListAdapter(this)
        binding.discoveryFoundListView.adapter = foundListAdapter

        connectionListAdapter = ConnectionListAdapter(this)
        binding.connectedListView.adapter = connectionListAdapter

        val selectFileButton = binding.selectFileButton
        selectFileButton.setOnClickListener {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
            intent.addCategory(Intent.CATEGORY_OPENABLE)
            intent.type = "*/*"
            filePickStartActivityForResult.launch(intent)
        }

        connectionListAdapter.setSendDataListener { endpoint: String, nickname: String ->
            if (willSendBytesMaps.isNotEmpty()) {
                // Fileを送る前にmessagePackを送り付けて聞く場合の方法
                //val objectMapper: ObjectMapper = MessagePackMapper()
                //val payloadRequestSendFile = Payload.fromBytes(objectMapper.writeValueAsBytes(willSendBytesMaps))
                val pfd = contentResolver.openFileDescriptor(Uri.parse(willSendBytesMaps["fileUri"].toString()), "r")
                val payloadRequestSendFile = Payload.fromFile(pfd!!)
                payloadRequestSendFile.setFileName(willSendBytesMaps["fileName"].toString())
                nearbyConnectionManager.sendPayload(endpoint, payloadRequestSendFile)
            }

        }

        foundListAdapter.setConnectionListener { endpoint: String, endpointInfo: DiscoveredEndpointInfo ->
            nearbyConnectionManager.requestConnection(nicknameEditText.text.toString(), endpoint)
        }
        nearbyConnectionManager.setConnectionCallback(object : NearbyConnectionManager.ConnectionCallback {
            override fun onDisconnected(endpointId: String) {
                connectionListAdapter.removeConnectionInfo(endpointId)
            }

            override fun onReceivedConnectionRequest(
                endpointId: String,
                connectionInfo: ConnectionInfo
            ) {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("${connectionInfo.endpointName} から接続要求を受け取りました")
                    .setMessage("接続しますか?")
                    .setPositiveButton("接続する") { dialog, id ->
                        nearbyConnectionManager.acceptConnection(endpointId)
                    }.setNegativeButton("拒否") { dialog, id ->
                        nearbyConnectionManager.rejectConnection(endpointId)
                    }
                    .show()
            }

            override fun onConnectionSuccess(endpointId: String, nickname: String) {
                connectionListAdapter.putConnectionInfo(endpointId, nickname)
            }

            override fun onEndpointFound(
                endpointId: String,
                discoveredEndpointInfo: DiscoveredEndpointInfo
            ) {
                foundListAdapter.putFoundEndpoint(endpointId, discoveredEndpointInfo)
            }

            override fun onEndpointLost(endpointId: String) {
                foundListAdapter.removeFoundEndpoint(endpointId)
            }

        })
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
            Log.d(TAG, "payloadReceived:${endpointId} payloadId:${payload.id} type:${payload.type}")
            when (payload.type) {
                Payload.Type.BYTES -> {
                    // バイト配列を受け取った時
                    val bytes = payload.asBytes()!!
                    val objectMapper: ObjectMapper = MessagePackMapper()
                    val deserialized: Map<String, Any> = objectMapper.readValue(
                        bytes,
                        object : TypeReference<Map<String, Any>>() {}
                    )
                    for((key, value) in deserialized){
                        Log.d(TAG, "key:${key} value:${value}")
                    }
                    if(deserialized["action"] == "requestSendFile"){
                        val map = mutableMapOf<String, Any>()
                        map["action"] = "responseSendFile"
                        map["message"] = "OK"
                        val objectMapper: ObjectMapper = MessagePackMapper()
                        val payloadResponseSendFile = Payload.fromBytes(objectMapper.writeValueAsBytes(map))
                        nearbyConnectionManager.sendPayload(endpointId, payloadResponseSendFile)
                    } else if(deserialized["action"] == "responseSendFile") {
                        val pfd = contentResolver.openFileDescriptor(Uri.parse(willSendBytesMaps["fileUri"].toString()), "r")
                        val payload = Payload.fromFile(pfd!!)
                        nearbyConnectionManager.sendPayload(endpointId, payload)
                    }
                    // 処理
                }
                Payload.Type.FILE -> {
                    // ファイルを受け取った時
                    // このメソッドを実行してUriを取得しているときにはもう既にファイルが出来上がっている file名payload.idの値
                    val payloadFile = payload.asFile()!!
                    val payloadFileUri = payloadFile.asUri()
                    Log.d(TAG, "payloadFileUri:${payloadFileUri.toString()} path:${payloadFileUri!!.path}")
                }
                Payload.Type.STREAM -> {
                    // ストリームを受け取った時
                    val stream = payload.asStream()!!
                    // 処理
                }
            }
        }

        // データを送受信されるたびに呼ばれる
        // ファイル転送などは途中の経過して呼ばれる
        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // 転送状態が更新された時詳細は省略
            Log.d(TAG, "payloadUpdate:${endpointId} payloadId:${update.payloadId} status:${update.status} bytesTransferred:${update.bytesTransferred} totalBytes:${update.totalBytes}")
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